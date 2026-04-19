/**
 * GroqService.ts
 * Primary LLM judge — uses Groq's OpenAI-compatible chat completions API.
 * Model: llama-3.3-70b-versatile — best accuracy/speed tradeoff on Groq.
 * Falls back gracefully: returns source 'fallback' so the orchestrator
 * can hand off to GeminiService.
 */

import type { GeminiResult } from '../types.js';
import { clamp, safeParseJson, normalizeToCategory, normalizeToPriority, errMsg } from '../utils/Utility.js';
import { KeywordClassifier } from './KeywordClassifier.js';

interface LLMRawResult {
  category:            string;
  priority:            string;
  urgency_score:       number;
  confidence:          number;
  spam:                boolean;
  recommended_actions: string[];
}

export class GroqService {
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
    this.model        = config.model    ?? 'llama-3.3-70b-versatile';
    this.baseUrl      = config.baseUrl  ?? 'https://api.groq.com/openai/v1';
    this.timeoutMs    = config.timeoutMs ?? 10_000;
    this.fetchImpl    = config.fetchImpl ?? fetch;
    this.kwClassifier = new KeywordClassifier();
  }

  async classify(
    text:            string,
    validCategories: string[] = ['Product', 'Packaging', 'Trade', 'Invalid'],
    validPriorities: string[] = ['High', 'Medium', 'Low'],
  ): Promise<GeminiResult> {
    const apiKey = this.apiKey ?? process.env.GROQ_API_KEY;
    if (!apiKey) return this.buildFallback(text, validCategories, validPriorities);

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:           this.model,
          temperature:     0.1,
          top_p:           0.8,
          max_tokens:      512,
          messages: [
            { role: 'system', content: this.buildSystemPrompt(validCategories, validPriorities) },
            { role: 'user',   content: `Complaint: "${text}"` },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: ctrl.signal,
      });

      if (!response.ok) return this.buildFallback(text, validCategories, validPriorities);

      const payload = await response.json() as Record<string, unknown>;
      const rawText = this.extractText(payload);
      const parsed  = safeParseJson<LLMRawResult>(rawText);
      if (!parsed) return this.buildFallback(text, validCategories, validPriorities);

      return this.normalize(parsed, validCategories, validPriorities);
    } catch {
      return this.buildFallback(text, validCategories, validPriorities);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildSystemPrompt(categories: string[], priorities: string[]): string {
    return [
      'You are an expert complaint triage specialist for a consumer goods and healthcare company.',
      'Analyze the complaint and return ONLY a valid JSON object — no markdown, no explanation.',
      '',
      'Required JSON shape:',
      '{',
      `  "category": one of [${categories.map(c => `"${c}"`).join(', ')}],`,
      `  "priority": one of [${priorities.map(p => `"${p}"`).join(', ')}],`,
      '  "urgency_score": number between 0.0 and 1.0,',
      '  "confidence": number between 0.0 and 1.0,',
      '  "spam": boolean,',
      '  "recommended_actions": array of 2-3 specific actionable strings for the support agent',
      '}',
      '',
      '━━━ CATEGORY RULES ━━━',
      `"${categories[0]}" (Product) → Use for:`,
      '  • Physical injury, harm, pain, accident, bleeding, fracture, hospitalization',
      '  • Worsened medical condition, aggravated condition',
      '  • Trainer / instructor / coach / physiotherapist causing harm or injury',
      '  • Exercise, workout, therapy that caused harm or worsened health',
      '  • Side effects, adverse reactions, allergic reactions, nausea, vomiting',
      '  • Food poisoning, contamination, foreign particles, breathing difficulty',
      '  • Defective, expired, wrong, or unsafe product',
      '  • Negligence causing personal harm',
      '',
      `"${categories[1]}" (Packaging) → Use for:`,
      '  • Damaged, broken, leaking, tampered, or crushed packaging',
      '  • Broken seal, cracked bottle, missing label — packaging is the primary issue',
      '  • NOT for health harm caused by the product inside',
      '',
      `"${categories[2]}" (Trade) → Use for:`,
      '  • Bulk orders, pricing inquiries, distributor/retailer/wholesale queries',
      '  • Invoices, quotations, trade schemes, purchase orders',
      '  • Purely commercial or business-to-business queries',
      '',
      `"${categories[categories.length - 1]}" (Invalid) → Use ONLY for:`,
      '  • Completely meaningless input, random characters, greetings with zero complaint context',
      '  • NEVER use for health, injury, service failure, or product complaints',
      '',
      '━━━ PRIORITY RULES ━━━',
      `"${priorities[0]}" (High) → ANY of:`,
      '  • Physical injury, pain, harm, accident, bleeding, hospitalization',
      '  • Worsened or aggravated medical condition',
      '  • Trainer/instructor/coach/therapist caused injury or harm',
      '  • Exercise or therapy that caused harm',
      '  • Contamination, food poisoning, allergic reaction, breathing difficulty',
      '  • Tampered product, broken seal with safety risk',
      '  • Urgent, emergency, life-threatening situation',
      '',
      `"${priorities[1] ?? priorities[0]}" (Medium) → `,
      '  • Quality complaint, packaging damage without safety risk',
      '  • Replacement/refund request, service dissatisfaction without physical harm',
      '',
      `"${priorities[priorities.length - 1]}" (Low) → `,
      '  • Routine inquiry, pricing question, general information request',
      '',
      '━━━ URGENCY SCORE ━━━',
      '  0.90–1.00 → physical injury, life-threatening, worsened medical condition',
      '  0.70–0.89 → serious harm, negligence, trainer-caused harm, contamination',
      '  0.50–0.69 → quality issues, service failure, significant dissatisfaction',
      '  0.20–0.49 → routine inquiry, minor complaint',
      '',
      '━━━ SPAM ━━━',
      '  spam: true ONLY if input is gibberish, random characters, or completely meaningless.',
      '',
      '━━━ CRITICAL RULES ━━━',
      '  1. ANY physical injury, harm, pain, or worsened condition → always High priority.',
      '  2. Trainer/instructor/coach/therapist causing harm → category=Product, priority=High.',
      '  3. Never classify a genuine complaint (injury, harm, health, service failure) as Invalid.',
      '  4. recommended_actions must be specific and actionable for the support team.',
    ].join('\n');
  }

  private extractText(payload: Record<string, unknown>): string {
    const choices = (payload as any)?.choices;
    if (!Array.isArray(choices) || choices.length === 0) return '';
    const content = choices[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : '';
  }

  private normalize(raw: LLMRawResult, validCategories: string[], validPriorities: string[]): GeminiResult {
    return {
      category:            normalizeToCategory(raw.category, validCategories) as GeminiResult['category'],
      priority:            normalizeToPriority(raw.priority, validPriorities) as GeminiResult['priority'],
      urgency_score:       clamp(Number(raw.urgency_score ?? 0.4)),
      confidence:          clamp(Number(raw.confidence   ?? 0.5)),
      spam:                Boolean(raw.spam),
      recommended_actions: Array.isArray(raw.recommended_actions)
        ? raw.recommended_actions.map(String).map(s => s.trim()).filter(s => s.length > 0)
        : [],
      source: 'groq',
    };
  }

  private buildFallback(text: string, validCategories: string[], validPriorities: string[]): GeminiResult {
    const kw = this.kwClassifier.classify(text);
    const fallbackCat = kw.category === 'Unknown' ? validCategories[validCategories.length - 1] : kw.category;
    const lower    = text.toLowerCase();
    const isUrgent = ['urgent', 'immediately', 'broken', 'defective', 'damaged',
      'leaking', 'tampered', 'injured', 'injury', 'hurt', 'pain',
      'worsened', 'aggravated', 'trainer', 'negligence'].some(k => lower.includes(k));
    const priority = isUrgent
      ? validPriorities[0]
      : fallbackCat === 'Trade'
        ? validPriorities[validPriorities.length - 1]
        : validPriorities[Math.floor(validPriorities.length / 2)];

    return {
      category:            fallbackCat as GeminiResult['category'],
      priority:            priority    as GeminiResult['priority'],
      urgency_score:       isUrgent ? 0.75 : 0.35,
      confidence:          0.50,
      spam:                false,
      recommended_actions: [],
      source:              'fallback',
    };
  }
}
