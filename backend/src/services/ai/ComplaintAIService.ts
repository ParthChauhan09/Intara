/**
 * ComplaintAIService.ts
 * Singleton orchestrator — domain-agnostic processing pipeline.
 *
 * Pipeline: Groq (primary LLM) → Gemini (fallback LLM) → keyword/ML ensemble
 *
 * Public API:
 *   ComplaintAIService.process(text, categories, priorities, config?)
 */

import { MLClassifier }      from './services/MLClassifier.js';
import { GeminiService }     from './services/GeminiService.js';
import { GroqService }       from './services/GroqService.js';
import { KeywordClassifier } from './services/KeywordClassifier.js';
import { clamp, phraseMatch, normalizeToCategory } from './utils/Utility.js';
import {
  DEFAULT_CATEGORIES, DEFAULT_PRIORITIES,
  URGENCY_SIGNALS, RECOMMENDED_ACTIONS,
  WEIGHTS, THRESHOLDS, LOW_PRIORITY_CATEGORY,
} from './constants.js';
import type {
  MLResult, KeywordResult, GeminiResult,
  ComplaintOutput, ServiceConfig, SlaRisk,
} from './types.js';

export class ComplaintAIService {
  private static instance: ComplaintAIService | null = null;

  private readonly ml:      MLClassifier;
  private readonly groq:    GroqService;
  private readonly gemini:  GeminiService;
  private readonly keyword: KeywordClassifier;

  private readonly urgencySignals:      Array<[string, number]>;
  private readonly recommendedActions:  Record<string, Record<string, string>>;
  private readonly lowPriorityCategory: string;

  private readonly categoryCounts = new Map<string, number>();

  private constructor(config: ServiceConfig = {}) {
    this.urgencySignals      = config.urgencySignals      ?? URGENCY_SIGNALS;
    this.recommendedActions  = config.recommendedActions  ?? RECOMMENDED_ACTIONS;
    this.lowPriorityCategory = config.lowPriorityCategory ?? LOW_PRIORITY_CATEGORY;

    this.ml      = new MLClassifier();
    this.keyword = new KeywordClassifier();
    this.groq    = new GroqService({
      apiKey:    config.groqApiKey,
      model:     config.groqModel,
      baseUrl:   config.groqApiBaseUrl,
      timeoutMs: config.requestTimeoutMs,
      fetchImpl: config.fetchImpl,
    });
    this.gemini  = new GeminiService({
      apiKey:    config.geminiApiKey,
      model:     config.geminiModel,
      baseUrl:   config.geminiApiBaseUrl,
      timeoutMs: config.requestTimeoutMs,
      fetchImpl: config.fetchImpl,
    });
  }

  static async process(
    text:       string,
    categories: string[] = [...DEFAULT_CATEGORIES],
    priorities: string[] = [...DEFAULT_PRIORITIES],
    config?:    ServiceConfig,
  ): Promise<ComplaintOutput> {
    if (!ComplaintAIService.instance || config?.groqApiKey || config?.geminiApiKey) {
      ComplaintAIService.instance = new ComplaintAIService(config ?? {});
    }
    return ComplaintAIService.instance.run(text, categories, priorities);
  }

  static reset(): void {
    ComplaintAIService.instance = null;
  }

  private async run(
    inputText:  string,
    categories: string[],
    priorities: string[],
  ): Promise<ComplaintOutput> {
    // Layer 1: Validation
    const validation = this.validateInput(inputText);
    if (!validation.valid) {
      return { status: 'Rejected', reason: validation.reason };
    }
    const text = validation.cleanedText;

    // Layers 2+3+4: Parallel — ML, Keyword, Groq (primary LLM)
    const [mlResult, keywordResult, groqResult] = await Promise.all([
      Promise.resolve(this.ml.classify(text)),
      Promise.resolve(this.keyword.classify(text)),
      this.groq.classify(text, categories, priorities),
    ]);

    // Layer 4.5: Groq failed → try Gemini
    let llmResult = groqResult;
    if (groqResult.source === 'fallback') {
      llmResult = await this.gemini.classify(text, categories, priorities);
    }

    // Layer 4.6: Both LLMs failed
    if (llmResult.source === 'fallback') {
      return { status: 'Needs Review', reason: 'Classification service temporarily unavailable. Please try again.', pattern_alert: null, escalation: 'Manual review required' };
    }

    // Layer 5: Spam gate
    if (llmResult.spam) {
      return { status: 'Needs Review', reason: 'Spam or meaningless input detected', pattern_alert: null, escalation: 'Manual review required' };
    }
    if (keywordResult.category === 'Unknown'
        && (mlResult?.confidence ?? 0) < THRESHOLDS.SPAM_ML_CONFIDENCE
        && llmResult.confidence < THRESHOLDS.SPAM_GEMINI_CONFIDENCE) {
      return { status: 'Needs Review', reason: 'Unable to classify — all layers low confidence', pattern_alert: null, escalation: 'Manual review required' };
    }

    // Layer 6: Ensemble category
    const { category, confidence, categoryReasoning } = this.ensembleCategory(mlResult, keywordResult, llmResult, categories, text);

    // Layer 7: Ensemble priority
    const { priority, urgencyScore, priorityReasoning } = this.ensemblePriority(text, category, llmResult, priorities);

    // Layer 8: SLA risk
    const slaRisk = this.calcSlaRisk(urgencyScore);

    // Layer 9: Pattern detection
    const patternAlert = this.updatePattern(category);

    // Layer 10: Escalation
    const escalation = this.decideEscalation(priority, urgencyScore, priorities);

    // Layer 11: Recommended actions
    const recommendedActions = llmResult.recommended_actions?.length > 0
      ? llmResult.recommended_actions
      : [(this.recommendedActions[category]?.[priority] ?? `Route ${category} ${priority} complaint to support.`)];

    return {
      status:              'Success',
      category,
      priority,
      urgency_score:       urgencyScore,
      sla_risk:            slaRisk,
      recommended_actions: recommendedActions,
      reasoning:           [categoryReasoning, priorityReasoning].filter(Boolean).join(' | '),
      confidence,
      pattern_alert:       patternAlert,
      escalation,
    };
  }

  // ─── Layer 1: Validation ──────────────────────────────────────────────────────
  private validateInput(text: string): { valid: true; cleanedText: string } | { valid: false; reason: string } {
    const cleaned = (text ?? '').trim();
    if (cleaned.length < 5) return { valid: false, reason: 'Input too short' };

    const alphaNum = (cleaned.match(/[a-z0-9]/gi) ?? []).length;
    const nonSpace = cleaned.replace(/\s/g, '').length;
    if (nonSpace > 0 && alphaNum / nonSpace < 0.35) return { valid: false, reason: 'Invalid or spam input' };

    const words = (cleaned.toLowerCase().match(/[a-z]+/g) ?? []).filter(Boolean);
    if (words.length === 0) return { valid: false, reason: 'Invalid or spam input' };
    if (words.length === 1 && words[0].length <= 4) return { valid: false, reason: 'Input too short or meaningless' };

    const hasRepeatedCharSpam = words.some(w => {
      if (w.length < 4) return false;
      const charCounts: Record<string, number> = {};
      for (const ch of w) charCounts[ch] = (charCounts[ch] ?? 0) + 1;
      return Math.max(...Object.values(charCounts)) / w.length > 0.50;
    });
    if (hasRepeatedCharSpam) return { valid: false, reason: 'Invalid or spam input' };

    const meaninglessWords = new Set([
      'hello', 'hey', 'hi', 'test', 'testing', 'okay', 'ok', 'yes', 'no',
      'some', 'thing', 'stuff', 'blah', 'lol', 'haha', 'hmm', 'umm', 'ugh',
      'what', 'why', 'how', 'who', 'when', 'where', 'help', 'please',
    ]);
    if (words.length === 1 && meaninglessWords.has(words[0])) {
      return { valid: false, reason: 'Input too short or meaningless' };
    }

    const longWords  = words.filter(w => w.length >= 5);
    const allGibberish = longWords.length > 0 && longWords.every(w => !/[aeiou]/.test(w));
    const joined     = words.join('');
    const vowelRatio = (joined.match(/[aeiou]/g) ?? []).length / joined.length;
    if (allGibberish || vowelRatio < 0.10) return { valid: false, reason: 'Invalid or spam input' };

    return { valid: true, cleanedText: cleaned };
  }

  // ─── Layer 6: Ensemble category ───────────────────────────────────────────────
  private ensembleCategory(
    ml:         MLResult | null,
    keyword:    KeywordResult,
    ai:         GeminiResult,
    categories: string[],
    inputText:  string,
  ): { category: string; confidence: number; categoryReasoning: string } {
    const parts: string[] = [];
    const votes: Record<string, number> = {};
    categories.forEach(c => { votes[c] = 0; });

    if (ml) {
      const mlCat = normalizeToCategory(ml.category, categories);
      for (const [cls, prob] of Object.entries(ml.probabilities)) {
        const n = normalizeToCategory(cls, categories);
        votes[n] = (votes[n] ?? 0) + prob * WEIGHTS.ML_DEFAULT;
      }
      parts.push(`ML(${mlCat} ${(ml.confidence * 100).toFixed(0)}%)`);
    }

    if (ai.source !== 'fallback') {
      const aiCat    = normalizeToCategory(ai.category, categories);
      const mlCat    = ml ? normalizeToCategory(ml.category, categories) : null;
      const disagree = mlCat && mlCat !== aiCat && ai.confidence >= THRESHOLDS.GEMINI_OVERRIDE_CONFIDENCE;
      const gw       = disagree ? WEIGHTS.GEMINI_OVERRIDE : WEIGHTS.GEMINI_DEFAULT;
      const mw       = disagree ? WEIGHTS.ML_OVERRIDE     : WEIGHTS.ML_DEFAULT;

      if (ml && disagree) {
        for (const [cls, prob] of Object.entries(ml.probabilities)) {
          const n = normalizeToCategory(cls, categories);
          votes[n] = (votes[n] ?? 0) - prob * WEIGHTS.ML_DEFAULT + prob * mw;
        }
      }

      votes[aiCat] = (votes[aiCat] ?? 0) + ai.confidence * gw;
      const others = Object.keys(votes).filter(c => c !== aiCat);
      const rem    = (1 - ai.confidence) * gw / Math.max(others.length, 1);
      others.forEach(c => { votes[c] = (votes[c] ?? 0) + rem; });
      parts.push(`LLM(${ai.source}:${aiCat} ${(ai.confidence * 100).toFixed(0)}%)`);
    } else {
      const aiCat = normalizeToCategory(ai.category, categories);
      votes[aiCat] = (votes[aiCat] ?? 0) + ai.confidence * WEIGHTS.FALLBACK_GEMINI;
    }

    if (keyword.category !== 'Unknown') {
      const kwCat = normalizeToCategory(keyword.category, categories);
      votes[kwCat] = (votes[kwCat] ?? 0) + keyword.confidence * WEIGHTS.KEYWORD;
      parts.push(`Keyword(${kwCat})`);
    }

    const lowerText = inputText?.toLowerCase() ?? '';
    const healthSignals = ['side effect', 'adverse reaction', 'allergic reaction', 'nausea',
      'vomiting', 'food poisoning', 'foreign particles', 'foreign particle', 'breathing',
      'unwell', 'feeling unwell', 'reaction', 'symptoms', 'contaminated', 'unsafe',
      'injured', 'injury', 'hurt', 'pain', 'accident', 'negligence', 'harmed',
      'physical harm', 'got hurt', 'got injured', 'worsened', 'aggravated',
      'trainer', 'instructor', 'coach', 'exercise', 'workout', 'medical condition',
      'physical therapy', 'physiotherapy', "didn't guide", 'improper guidance', 'not guided'];
    const packagingSpecific = ['tampered', 'seal', 'leaking', 'leaked', 'box was broken',
      'carton', 'pouch', 'packaging damaged', 'damaged packaging'];
    const hasHealthSignal    = healthSignals.some(s => lowerText.includes(s));
    const hasPackagingSignal = packagingSpecific.some(s => lowerText.includes(s));

    if (hasHealthSignal && !hasPackagingSignal && categories.includes('Product')) {
      const productVotes = votes['Product'] ?? 0;
      const maxOther = Math.max(...Object.entries(votes).filter(([k]) => k !== 'Product').map(([, v]) => v));
      if (maxOther > productVotes) {
        votes['Product'] = maxOther + 0.15;
      }
    }

    const invalidSignals = ['injured', 'injury', 'hurt', 'pain', 'accident', 'negligence',
      'harmed', 'worsened', 'aggravated', 'trainer', 'instructor', 'coach',
      'medical condition', 'side effect', 'adverse reaction', 'allergic', 'nausea',
      'vomiting', 'contaminated', 'food poisoning', 'breathing', 'exercise', 'workout',
      'physical therapy', 'physiotherapy', "didn't guide", 'not guided'];
    const hasInvalidBlocker = invalidSignals.some(s => lowerText.includes(s));
    if (hasInvalidBlocker && categories.includes('Product')) {
      const invalidVotes = votes['Invalid'] ?? 0;
      const productVotes = votes['Product'] ?? 0;
      if (invalidVotes >= productVotes) {
        votes['Product'] = invalidVotes + 0.20;
        votes['Invalid'] = 0;
      }
    }

    const [winCat, winScore] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    const baseConf   = clamp(totalVotes > 0 ? winScore / totalVotes : 0.5);

    const mlCat    = ml ? normalizeToCategory(ml.category, categories) : null;
    const aiCat    = normalizeToCategory(ai.category, categories);
    const kwCat    = keyword.category !== 'Unknown' ? normalizeToCategory(keyword.category, categories) : null;
    const allAgree = mlCat === winCat && aiCat === winCat && (kwCat === null || kwCat === winCat);
    const twoAgree = (mlCat === winCat && aiCat === winCat) || (mlCat === winCat && kwCat === winCat) || (aiCat === winCat && kwCat === winCat);

    let finalConf = baseConf;
    if (allAgree)      finalConf = clamp(baseConf + THRESHOLDS.AGREEMENT_BOOST_ALL);
    else if (twoAgree) finalConf = clamp(baseConf + THRESHOLDS.AGREEMENT_BOOST_TWO);

    return {
      category:          winCat,
      confidence:        finalConf,
      categoryReasoning: `${parts.join(' | ')} → ${winCat}(${(finalConf * 100).toFixed(0)}%)`,
    };
  }

  // ─── Layer 7: Ensemble priority ───────────────────────────────────────────────
  private ensemblePriority(
    text:       string,
    category:   string,
    ai:         GeminiResult,
    priorities: string[],
  ): { priority: string; urgencyScore: number; priorityReasoning: string } {
    const lower = text.toLowerCase();
    let maxSignalScore = 0;

    for (const [phrase, score] of this.urgencySignals) {
      if (phraseMatch(lower, phrase) && score > maxSignalScore) maxSignalScore = score;
    }

    const categoryBase  = this.keyword.getCategoryBaseWeight(text, category);
    const llmUrgency    = clamp(ai.urgency_score ?? 0.4);
    const highPriority  = priorities[0];
    const lowPriority   = priorities[priorities.length - 1];

    if (category === this.lowPriorityCategory && maxSignalScore === 0) {
      const urgencyScore = clamp(llmUrgency * 0.30 + categoryBase * 0.15);
      return { priority: lowPriority, urgencyScore, priorityReasoning: `${category} inquiry → ${lowPriority}` };
    }

    const urgencyScore = clamp(llmUrgency * 0.60 + maxSignalScore * 0.30 + categoryBase * 0.10);
    let priority = ai.priority;

    if (maxSignalScore >= THRESHOLDS.CRITICAL_SIGNAL_OVERRIDE && priority !== highPriority) {
      priority = highPriority;
    }
    if (urgencyScore >= THRESHOLDS.PRIORITY_UPGRADE_URGENCY && priority !== highPriority && category !== this.lowPriorityCategory) {
      priority = highPriority;
    }

    const highTriggers = ['stopped working', 'malfunctioning', 'carton crushed', 'bottle cracked',
      'changed color', 'smells bad', 'expired', 'escalate',
      'injured', 'injury', 'hurt', 'pain', 'accident', 'negligence', 'harmed',
      'worsened', 'aggravated', 'trainer', 'instructor', 'coach',
      'medical condition', "didn't guide", 'not guided', 'improper guidance',
      'physical therapy', 'physiotherapy', 'exercise', 'workout'];
    if (highTriggers.some(t => phraseMatch(lower, t)) && category !== this.lowPriorityCategory && priority !== highPriority) {
      priority = highPriority;
    }

    return {
      priority,
      urgencyScore,
      priorityReasoning: `LLM=${ai.priority} urgency=${urgencyScore.toFixed(2)} → ${priority}`,
    };
  }

  // ─── Layer 8: SLA risk ────────────────────────────────────────────────────────
  private calcSlaRisk(urgencyScore: number): SlaRisk {
    if (urgencyScore >= THRESHOLDS.URGENCY_HIGH)   return 'High Risk';
    if (urgencyScore >= THRESHOLDS.URGENCY_MEDIUM) return 'Medium Risk';
    return 'Low Risk';
  }

  // ─── Layer 9: Pattern detection ───────────────────────────────────────────────
  private updatePattern(category: string): string | null {
    const count = (this.categoryCounts.get(category) ?? 0) + 1;
    this.categoryCounts.set(category, count);
    if (count > 5) return `High frequency of ${category} complaints detected (${count} total)`;
    return null;
  }

  // ─── Layer 10: Escalation ─────────────────────────────────────────────────────
  private decideEscalation(priority: string, urgencyScore: number, priorities: string[]): string {
    const high   = priorities[0];
    const medium = priorities[1] ?? priorities[0];
    if (priority === high && urgencyScore >= THRESHOLDS.ESCALATE_IMMEDIATELY_URGENCY) return 'Escalate immediately';
    if (priority === high)   return 'Escalate to senior agent';
    if (priority === medium) return 'Assign to support agent';
    return 'Standard workflow';
  }
}

export default ComplaintAIService;
export type { ComplaintOutput as ComplaintAIResult, ServiceConfig as ComplaintAIServiceConfig };
