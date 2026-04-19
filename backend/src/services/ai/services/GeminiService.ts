/**
 * GeminiService.ts
 * Fallback LLM judge — used when Groq is unavailable.
 */

import type { GeminiResult } from '../types.js';
import { clamp, extractGeminiText, safeParseJson, normalizeToCategory, normalizeToPriority } from '../utils/Utility.js';
import { KeywordClassifier } from './KeywordClassifier.js';

interface GeminiRawResult {
  category:            string;
  priority:            string;
  urgency_score:       number;
  confidence:          number;
  spam:                boolean;
  recommended_actions: string[];
}

export class GeminiService {
  private readonly apiKey?:      string;
  private readonly model:        string;
  private readonly baseUrl:      string;
  private readonly timeoutMs:    number;
  private readonly fetchImpl:    typeof fetch;
  private readonly kwClassifier: KeywordClassifier;

  constructor(config: {
    apiKey?:    string;
    model?:     string;
    baseUrl?:   string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    this.apiKey       = config.apiKey;
    this.model        = config.model    ?? 'gemini-2.5-flash';
    this.baseUrl      = config.baseUrl  ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.timeoutMs    = config.timeoutMs ?? 12_000;
    this.fetchImpl    = config.fetchImpl ?? fetch;
    this.kwClassifier = new KeywordClassifier();
  }

  async classify(
    text:            string,
    validCategories: string[] = ['Product', 'Packaging', 'Trade', 'Invalid'],
    validPriorities: string[] = ['High', 'Medium', 'Low'],
  ): Promise<GeminiResult> {
    const apiKey = this.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) return this.buildFallback(text, validCategories, validPriorities);

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

      if (!response.ok) return this.buildFallback(text, validCategories, validPriorities);

      const payload = await response.json() as Record<string, unknown>;
      const rawText = extractGeminiText(payload);
      const parsed  = safeParseJson<GeminiRawResult>(rawText);
      if (!parsed) return this.buildFallback(text, validCategories, validPriorities);

      return this.normalize(parsed, validCategories, validPriorities);
    } catch {
      return this.buildFallback(text, validCategories, validPriorities);
    } finally {
      clearTimeout(timer);
    }
  }

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
      'CATEGORY DEFINITIONS (pick the best fit — do NOT use Invalid unless truly unclassifiable):',
      '  Product  → physical harm, health risk, injury, pain, worsened condition, side effects,',
      '             contamination, defective/expired/wrong product, food poisoning, allergic reaction,',
      '             breathing difficulty, negligence causing harm, trainer/instructor/coach causing',
      '             injury or worsening a medical condition, exercise or therapy that caused harm.',
      '  Packaging → damaged/broken/leaking/tampered packaging, broken seal, cracked bottle,',
      '              crushed carton, missing label — where PACKAGING is the primary issue.',
      '  Trade    → bulk orders, pricing inquiries, distributor/retailer/wholesale queries,',
      '             invoices, quotations, trade schemes — purely commercial queries.',
      '  Invalid  → ONLY completely meaningless input, random characters, greetings with zero',
      '             complaint context. NEVER for health, injury, service, or product complaints.',
      '',
      `Priority rules (${priorities[0]} = most urgent, ${priorities[priorities.length - 1]} = least urgent):`,
      `  ${priorities[0]} → physical injury, harm, pain, accident, hospitalization, health/safety risk,`,
      `           negligence causing harm, worsened medical condition, trainer/instructor caused harm,`,
      `           exercise caused harm, contamination, allergic reaction, food poisoning, emergency`,
      `  ${priorities[1] ?? priorities[0]} → quality complaint, packaging damage without safety risk,`,
      `           replacement/refund request, service dissatisfaction without physical harm`,
      `  ${priorities[priorities.length - 1]} → routine inquiry, pricing question, general information`,
      '',
      'Urgency score: 0.9-1.0 injury/emergency, 0.7-0.89 serious harm/negligence, 0.5-0.69 quality issues, 0.2-0.49 routine',
      'spam: true ONLY for gibberish/random characters/completely meaningless input.',
      'recommended_actions: 2-3 specific actionable steps for the support agent.',
      '',
      'CRITICAL: ANY injury/harm/worsened condition → High priority. Trainer/coach harm → Product/High. Never use Invalid for genuine complaints.',
    ].join('\n');
  }

  private normalize(raw: GeminiRawResult, validCategories: string[], validPriorities: string[]): GeminiResult {
    return {
      category:            normalizeToCategory(raw.category, validCategories) as GeminiResult['category'],
      priority:            normalizeToPriority(raw.priority, validPriorities) as GeminiResult['priority'],
      urgency_score:       clamp(Number(raw.urgency_score ?? 0.4)),
      confidence:          clamp(Number(raw.confidence   ?? 0.5)),
      spam:                Boolean(raw.spam),
      recommended_actions: Array.isArray(raw.recommended_actions)
        ? raw.recommended_actions.map(String).map(s => s.trim()).filter(s => s.length > 0)
        : [],
      source: 'gemini',
    };
  }

  private buildFallback(text: string, validCategories: string[], validPriorities: string[]): GeminiResult {
    const kw = this.kwClassifier.classify(text);
    const fallbackCat = kw.category === 'Unknown' ? validCategories[validCategories.length - 1] : kw.category;
    const lower    = text.toLowerCase();
    const isUrgent = ['urgent', 'immediately', 'broken', 'defective', 'damaged', 'leaking', 'tampered',
      'injured', 'injury', 'hurt', 'pain', 'worsened', 'aggravated', 'trainer', 'negligence'].some(k => lower.includes(k));
    const priority = isUrgent
      ? validPriorities[0]
      : fallbackCat === 'Trade'
        ? validPriorities[validPriorities.length - 1]
        : validPriorities[Math.floor(validPriorities.length / 2)];

    return {
      category:            fallbackCat as GeminiResult['category'],
      priority:            priority    as GeminiResult['priority'],
      urgency_score:       isUrgent ? 0.75 : 0.35,
      confidence:          0.55,
      spam:                false,
      recommended_actions: [],
      source:              'fallback',
    };
  }
}
