/**
 * GeminiService.ts
 * Gemini API call — responsible for priority, urgency, spam detection,
 * and recommended action. Domain prompt rules live here but categories
 * and priorities are injected at call time.
 */

import type { GeminiResult } from '../types.js';
import { clamp, extractGeminiText, safeParseJson, normalizeToCategory, normalizeToPriority, errMsg } from '../utils/Utility.js';
import { KeywordClassifier } from './KeywordClassifier.js';

interface GeminiRawResult {
  category:           string;
  priority:           string;
  urgency_score:      number;
  confidence:         number;
  spam:               boolean;
  recommended_actions: string[];
}

export class GeminiService {
  private apiKey?: string;
  private readonly model:        string;
  private readonly baseUrl:      string;
  private readonly timeoutMs:    number;
  private readonly fetchImpl:    typeof fetch;
  private readonly log:          (e: string, p?: unknown) => void;
  private readonly kwClassifier: KeywordClassifier;

  constructor(
    config: {
      apiKey?:    string;
      model?:     string;
      baseUrl?:   string;
      timeoutMs?: number;
      fetchImpl?: typeof fetch;
    },
    log: (e: string, p?: unknown) => void,
  ) {
    this.apiKey     = config.apiKey;
    this.model      = config.model    ?? 'gemini-2.5-flash';
    this.baseUrl    = config.baseUrl  ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.timeoutMs  = config.timeoutMs ?? 12_000;
    this.fetchImpl  = config.fetchImpl ?? fetch;
    this.log        = log;
    this.kwClassifier = new KeywordClassifier(log);
  }

  /** Calls Gemini API. Always returns a GeminiResult — falls back gracefully. */
  async classify(
    text:               string,
    validCategories:    string[] = ['Product', 'Packaging', 'Trade', 'Invalid'],
    validPriorities:    string[] = ['High', 'Medium', 'Low'],
  ): Promise<GeminiResult> {
    // Re-read the API key on every call so it's always fresh from env
    const apiKey = this.apiKey ?? process.env.GEMINI_API_KEY;

    if (!apiKey) {
      this.log('GeminiService.fallback', { reason: 'no_api_key' });
      return this.buildFallback(text, validCategories, validPriorities, 'No Gemini API key.');
    }

    const prompt = this.buildPrompt(text, validCategories, validPriorities);
    const url    = `${this.baseUrl}/models/${this.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const ctrl   = new AbortController();
    const timer  = setTimeout(() => ctrl.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          contents:         [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, topP: 0.8 },
        }),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        this.log('GeminiService.httpError', { status: response.status });
        return this.buildFallback(text, validCategories, validPriorities, `HTTP ${response.status}`);
      }

      const payload = await response.json() as Record<string, unknown>;
      const rawText = extractGeminiText(payload);
      const parsed  = safeParseJson<GeminiRawResult>(rawText);

      if (!parsed) {
        this.log('GeminiService.parseError', { rawText: rawText.slice(0, 200) });
        return this.buildFallback(text, validCategories, validPriorities, 'Parse failed');
      }

      const result = this.normalize(parsed, validCategories, validPriorities);
      this.log('GeminiService.classify', { category: result.category, priority: result.priority, confidence: result.confidence, spam: result.spam });
      return result;
    } catch (err) {
      this.log('GeminiService.exception', { message: errMsg(err) });
      return this.buildFallback(text, validCategories, validPriorities, `Exception: ${errMsg(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private buildPrompt(text: string, categories: string[], priorities: string[]): string {
    return [
      'You are a complaint triage specialist. Your job is to assess PRIORITY, URGENCY, CATEGORY, and recommend ACTIONS.',
      '',
      'Complaint:',
      `"${text}"`,
      '',
      'Return ONLY valid JSON (no markdown, no explanation):',
      '{',
      `  "category": "${categories.join(' | ')}",`,
      `  "priority": "${priorities.join(' | ')}",`,
      '  "urgency_score": 0.0-1.0,',
      '  "confidence": 0.0-1.0,',
      '  "spam": false,',
      '  "recommended_actions": ["first actionable step for the support team", "second actionable step"]',
      '}',
      '',
      `Priority rules (${priorities[0]} = most urgent, ${priorities[priorities.length - 1]} = least urgent):`,
      `  ${priorities[0]} → ANY of: physical injury, harm, pain, accident, hurt, bleeding, hospitalization,`,
      `           health risk, safety issue, negligence causing harm, emotional distress from serious incident,`,
      `           urgent/immediately/emergency, broken/defective/damaged product, tampered, leaking,`,
      `           contaminated, allergic reaction, food poisoning, breathing difficulty`,
      `  ${priorities[1] ?? priorities[0]} → quality complaint, packaging damage without safety risk,`,
      `           replacement/refund request, service dissatisfaction without physical harm`,
      `  ${priorities[priorities.length - 1]} → routine inquiry, pricing question, general information request`,
      '',
      'Urgency score guidelines:',
      '  0.9-1.0 → physical injury, health/safety emergency, life-threatening',
      '  0.7-0.89 → serious harm, negligence, broken/defective product, contamination',
      '  0.5-0.69 → quality issues, service failure, significant dissatisfaction',
      '  0.2-0.49 → routine inquiry, minor complaint',
      '',
      'spam: true ONLY if the input is gibberish, random characters, or completely meaningless.',
      'recommended_actions: Exactly 2-3 specific actionable steps for the support agent.',
      '',
      'IMPORTANT: If the complaint describes any physical injury, harm, pain, or safety risk to a person — always assign the highest priority regardless of category.',
    ].join('\n');
  }

  private normalize(raw: GeminiRawResult, validCategories: string[], validPriorities: string[]): GeminiResult {
    return {
      category:           normalizeToCategory(raw.category, validCategories) as GeminiResult['category'],
      priority:           normalizeToPriority(raw.priority, validPriorities) as GeminiResult['priority'],
      urgency_score:      clamp(Number(raw.urgency_score ?? 0.4)),
      confidence:         clamp(Number(raw.confidence   ?? 0.5)),
      spam:               Boolean(raw.spam),
      recommended_actions: Array.isArray(raw.recommended_actions) ? raw.recommended_actions.map(String).map(s => s.trim()).filter(s => s.length > 0) : [],
      source:             'gemini',
    };
  }

  private buildFallback(text: string, validCategories: string[], validPriorities: string[], reason: string): GeminiResult {
    const kw       = this.kwClassifier.classify(text);
    const fallbackCat = kw.category === 'Unknown'
      ? validCategories[validCategories.length - 1]  // last = Invalid/fallback
      : kw.category;
    const lower    = text.toLowerCase();
    const isUrgent = ['urgent', 'immediately', 'broken', 'defective', 'damaged', 'leaking', 'tampered'].some(k => lower.includes(k));
    const priority = isUrgent
      ? validPriorities[0]                            // first = High
      : fallbackCat === validCategories[validCategories.length - 2]  // second-to-last = Trade
        ? validPriorities[validPriorities.length - 1] // last = Low
        : validPriorities[Math.floor(validPriorities.length / 2)];   // middle = Medium

    this.log('GeminiService.fallback', { reason, category: fallbackCat, priority });
    return {
      category:           fallbackCat as GeminiResult['category'],
      priority:           priority as GeminiResult['priority'],
      urgency_score:      isUrgent ? 0.75 : 0.35,
      confidence:         0.55,
      spam:               false,
      recommended_actions: [],
      source:             'fallback',
    };
  }
}
