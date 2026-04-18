/**
 * ComplaintAIService.ts
 * Singleton orchestrator — domain-agnostic processing pipeline.
 *
 * All domain values (urgency signals, recommended actions, categories,
 * priorities, thresholds) come from constants.ts or ServiceConfig.
 * This class contains only orchestration and ensemble logic.
 *
 * Public API:
 *   ComplaintAIService.process(text, categories, priorities, config?)
 */

import { MLClassifier }      from './services/MLClassifier.js';
import { GeminiService }     from './services/GeminiService.js';
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
  private readonly gemini:  GeminiService;
  private readonly keyword: KeywordClassifier;
  private readonly enableLogs: boolean;

  // Injected or default domain config
  private readonly urgencySignals:      Array<[string, number]>;
  private readonly recommendedActions:  Record<string, Record<string, string>>;
  private readonly lowPriorityCategory: string;

  // Stateful: pattern detection counts per session
  private readonly categoryCounts = new Map<string, number>();

  private constructor(config: ServiceConfig = {}) {
    this.enableLogs          = config.enableLogs ?? true;
    this.urgencySignals      = config.urgencySignals      ?? URGENCY_SIGNALS;
    this.recommendedActions  = config.recommendedActions  ?? RECOMMENDED_ACTIONS;
    this.lowPriorityCategory = config.lowPriorityCategory ?? LOW_PRIORITY_CATEGORY;

    const log = this.log.bind(this);
    this.ml      = new MLClassifier(log);
    this.keyword = new KeywordClassifier(log);
    this.gemini  = new GeminiService({
      apiKey:    config.geminiApiKey,
      model:     config.geminiModel,
      baseUrl:   config.geminiApiBaseUrl,
      timeoutMs: config.requestTimeoutMs,
      fetchImpl: config.fetchImpl,
    }, log);
  }

  // ── Static entry point ────────────────────────────────────────────────────────
  static async process(
    text:       string,
    categories: string[] = [...DEFAULT_CATEGORIES],
    priorities: string[] = [...DEFAULT_PRIORITIES],
    config?:    ServiceConfig,
  ): Promise<ComplaintOutput> {
    if (!ComplaintAIService.instance) {
      ComplaintAIService.instance = new ComplaintAIService(config ?? {});
    }
    return ComplaintAIService.instance.run(text, categories, priorities);
  }

  static reset(): void {
    ComplaintAIService.instance = null;
  }

  // ── Pipeline ──────────────────────────────────────────────────────────────────
  private async run(
    inputText:  string,
    categories: string[],
    priorities: string[],
  ): Promise<ComplaintOutput> {
    this.log('process.start', { preview: inputText?.slice(0, 80) });

    // Layer 1: Validation
    const validation = this.validateInput(inputText);
    if (!validation.valid) {
      this.log('process.rejected', { reason: validation.reason });
      return { status: 'Rejected', reason: validation.reason };
    }
    const text = validation.cleanedText;

    // Layers 2+3+4: Parallel — ML, Keyword, Gemini
    const [mlResult, keywordResult, geminiResult] = await Promise.all([
      Promise.resolve(this.ml.classify(text)),
      Promise.resolve(this.keyword.classify(text)),
      this.gemini.classify(text, categories, priorities),
    ]);
    this.log('process.parallel', {
      ml:     mlResult     ? { cat: mlResult.category,     conf: mlResult.confidence }     : null,
      kw:     keywordResult ? { cat: keywordResult.category, conf: keywordResult.confidence } : null,
      gemini: { cat: geminiResult.category, pri: geminiResult.priority, conf: geminiResult.confidence, spam: geminiResult.spam },
    });

    // Layer 5: Spam gate
    if (geminiResult.spam) {
      return { status: 'Needs Review', reason: 'Spam or meaningless input detected', pattern_alert: null, escalation: 'Manual review required' };
    }
    if (mlResult && mlResult.confidence < THRESHOLDS.SPAM_ML_CONFIDENCE
        && keywordResult.category === 'Unknown'
        && geminiResult.confidence < THRESHOLDS.SPAM_GEMINI_CONFIDENCE) {
      return { status: 'Needs Review', reason: 'Unable to classify — all layers low confidence', pattern_alert: null, escalation: 'Manual review required' };
    }

    // Layer 6: Ensemble category
    const { category, confidence, categoryReasoning } = this.ensembleCategory(mlResult, keywordResult, geminiResult, categories, text);
    this.log('process.category', { category, confidence });

    // Layer 7: Ensemble priority
    const { priority, urgencyScore, priorityReasoning } = this.ensemblePriority(text, category, geminiResult, priorities);
    this.log('process.priority', { priority, urgencyScore });

    // Layer 8: SLA risk
    const slaRisk = this.calcSlaRisk(urgencyScore);

    // Layer 9: Pattern detection
    const patternAlert = this.updatePattern(category);

    // Layer 10: Escalation
    const escalation = this.decideEscalation(priority, urgencyScore, priorities);

    // Layer 11: Recommended action — Gemini's specific action, fallback to lookup
    const recommendedActions = geminiResult.recommended_actions && geminiResult.recommended_actions.length > 0
      ? geminiResult.recommended_actions
      : [(this.recommendedActions[category]?.[priority] ?? `Route ${category} ${priority} complaint to support.`)];

    const result: ComplaintOutput = {
      status:             'Success',
      category,
      priority,
      urgency_score:      urgencyScore,
      sla_risk:           slaRisk,
      recommended_actions: recommendedActions,
      reasoning:          [categoryReasoning, priorityReasoning].filter(Boolean).join(' | '),
      confidence,
      pattern_alert:      patternAlert,
      escalation,
    };
    this.log('process.success', result);
    return result;
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
    if (words.length === 1 && words[0].length <= 3) return { valid: false, reason: 'Input too short or meaningless' };

    // Only reject gibberish if ALL long words have no vowels (not just one)
    const longWords = words.filter(w => w.length >= 5);
    const allGibberish = longWords.length > 0 && longWords.every(w => !/[aeiou]/.test(w));
    const joined     = words.join('');
    const vowelRatio = (joined.match(/[aeiou]/g) ?? []).length / joined.length;
    // Raise threshold: only reject if vowel ratio < 0.10 (was 0.15) to avoid false positives
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

    // ML vote
    if (ml) {
      const mlCat = normalizeToCategory(ml.category, categories);
      for (const [cls, prob] of Object.entries(ml.probabilities)) {
        const n = normalizeToCategory(cls, categories);
        votes[n] = (votes[n] ?? 0) + prob * WEIGHTS.ML_DEFAULT;
      }
      parts.push(`ML(${mlCat} ${(ml.confidence * 100).toFixed(0)}%)`);
    }

    // Gemini vote — adaptive weight when it strongly disagrees with ML
    if (ai.source === 'gemini') {
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
      parts.push(`Gemini(${aiCat} ${(ai.confidence * 100).toFixed(0)}% w=${gw})`);
    } else {
      const aiCat = normalizeToCategory(ai.category, categories);
      votes[aiCat] = (votes[aiCat] ?? 0) + ai.confidence * WEIGHTS.FALLBACK_GEMINI;
      parts.push(`Gemini(fallback ${aiCat})`);
    }

    // Keyword vote
    if (keyword.category !== 'Unknown') {
      const kwCat = normalizeToCategory(keyword.category, categories);
      votes[kwCat] = (votes[kwCat] ?? 0) + keyword.confidence * WEIGHTS.KEYWORD;
      parts.push(`Keyword(${kwCat} "${keyword.topKeyword}")`);
    }

    // Health/safety override: Product wins ONLY when health signals are present
    // AND there are no dominant Packaging-specific signals (seal/tamper/leak/box)
    const lowerText = inputText?.toLowerCase() ?? '';
    const healthSignals = ['side effect', 'adverse reaction', 'allergic reaction', 'nausea',
      'vomiting', 'food poisoning', 'foreign particles', 'foreign particle', 'breathing',
      'unwell', 'feeling unwell', 'reaction', 'symptoms', 'contaminated', 'unsafe'];
    const packagingSpecific = ['tampered', 'seal', 'leaking', 'leaked', 'box was broken',
      'carton', 'pouch', 'packaging damaged', 'damaged packaging'];
    const hasHealthSignal    = healthSignals.some(s => lowerText.includes(s));
    const hasPackagingSignal = packagingSpecific.some(s => lowerText.includes(s));

    // Only override to Product if health signal present AND no strong packaging context
    if (hasHealthSignal && !hasPackagingSignal && categories.includes('Product')) {
      const productVotes = votes['Product'] ?? 0;
      const maxOther = Math.max(...Object.entries(votes).filter(([k]) => k !== 'Product').map(([, v]) => v));
      if (maxOther > productVotes) {
        votes['Product'] = maxOther + 0.15;
        parts.push('Health/safety signal → Product override.');
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
    if (allAgree)      { finalConf = clamp(baseConf + THRESHOLDS.AGREEMENT_BOOST_ALL); parts.push('→ All 3 agree ✓✓✓'); }
    else if (twoAgree) { finalConf = clamp(baseConf + THRESHOLDS.AGREEMENT_BOOST_TWO); parts.push('→ 2/3 agree ✓✓'); }
    else               { parts.push(`→ Disagreement: ML=${mlCat ?? 'n/a'} Gemini=${aiCat} Keyword=${kwCat ?? 'n/a'}`); }

    return { category: winCat, confidence: finalConf, categoryReasoning: `Category: ${parts.join(' | ')}. Winner=${winCat}(${(finalConf * 100).toFixed(0)}%).` };
  }

  // ─── Layer 7: Ensemble priority ───────────────────────────────────────────────
  private ensemblePriority(
    text:       string,
    category:   string,
    ai:         GeminiResult,
    priorities: string[],
  ): { priority: string; urgencyScore: number; priorityReasoning: string } {
    const lower          = text.toLowerCase();
    const parts: string[] = [];
    let maxSignalScore   = 0;
    const matchedSignals: string[] = [];

    for (const [phrase, score] of this.urgencySignals) {
      if (phraseMatch(lower, phrase)) {
        matchedSignals.push(`"${phrase}"(${score.toFixed(2)})`);
        if (score > maxSignalScore) maxSignalScore = score;
      }
    }

    const categoryBase  = this.keyword.getCategoryBaseWeight(text, category);
    const geminiUrgency = clamp(ai.urgency_score ?? 0.4);
    const highPriority  = priorities[0];
    const lowPriority   = priorities[priorities.length - 1];

    // Hard rule: low-priority category + no urgency signals → always lowest priority
    if (category === this.lowPriorityCategory && maxSignalScore === 0) {
      const urgencyScore = clamp(geminiUrgency * 0.30 + categoryBase * 0.15);
      parts.push(`${category} inquiry, no urgency signals → ${lowPriority}. Urgency=${urgencyScore.toFixed(3)}.`);
      return { priority: lowPriority, urgencyScore, priorityReasoning: `Priority: ${parts.join(' ')}` };
    }

    const urgencyScore = clamp(geminiUrgency * 0.55 + maxSignalScore * 0.30 + categoryBase * 0.15);
    let priority       = ai.source === 'gemini' ? ai.priority : priorities[Math.floor(priorities.length / 2)];

    // Critical signal override → highest priority
    if (maxSignalScore >= THRESHOLDS.CRITICAL_SIGNAL_OVERRIDE && priority !== highPriority) {
      priority = highPriority;
      parts.push(`OVERRIDE→${highPriority}: critical signal (${matchedSignals[0]}).`);
    }
    // Urgency score upgrade
    if (urgencyScore >= THRESHOLDS.PRIORITY_UPGRADE_URGENCY && priority !== highPriority && category !== this.lowPriorityCategory) {
      priority = highPriority;
      parts.push(`UPGRADE→${highPriority}: urgency=${urgencyScore.toFixed(2)} ≥ ${THRESHOLDS.PRIORITY_UPGRADE_URGENCY}.`);
    }
    // Direct High priority triggers for product/packaging failures
    const highTriggers = ['stopped working', 'malfunctioning', 'carton crushed', 'bottle cracked',
      'changed color', 'smells bad', 'expired', 'escalate'];
    const hasHighTrigger = highTriggers.some(t => phraseMatch(lower, t));
    if (hasHighTrigger && category !== this.lowPriorityCategory && priority !== highPriority) {
      priority = highPriority;
      parts.push(`UPGRADE→${highPriority}: high-trigger keyword detected.`);
    }

    if (matchedSignals.length > 0) parts.push(`Signals: ${matchedSignals.slice(0, 3).join(', ')}.`);
    parts.push(`Gemini=${ai.priority}(u=${geminiUrgency.toFixed(2)}) kw=${maxSignalScore.toFixed(2)} base=${categoryBase.toFixed(2)} → urgency=${urgencyScore.toFixed(3)}, priority=${priority}.`);

    return { priority, urgencyScore, priorityReasoning: `Priority: ${parts.join(' ')}` };
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

  // ─── Logger ───────────────────────────────────────────────────────────────────
  private log(event: string, payload?: unknown): void {
    if (!this.enableLogs) return;
    payload !== undefined
      ? console.log(`[ComplaintAIService] ${event}`, payload)
      : console.log(`[ComplaintAIService] ${event}`);
  }
}

export default ComplaintAIService;
export type { ComplaintOutput as ComplaintAIResult, ServiceConfig as ComplaintAIServiceConfig };
