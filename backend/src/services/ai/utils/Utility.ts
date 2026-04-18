/**
 * Utility.ts
 * Pure stateless helper functions shared across all service modules.
 * No domain knowledge, no imports from other integration files.
 */

/** Clamp a number to [0, 1], rounded to 3 decimal places. */
export function clamp(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
}

/** Match a phrase in text — multi-word uses includes, single word uses word boundary. */
export function phraseMatch(text: string, phrase: string): boolean {
  if (phrase.includes(' ')) return text.includes(phrase.toLowerCase());
  return new RegExp(`\\b${phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text);
}

/** Safely parse JSON from a raw string, handling fenced code blocks. */
export function safeParseJson<T = Record<string, unknown>>(text: string): T | null {
  if (!text?.trim()) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw    = fenced?.[1] ?? (() => {
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    return s >= 0 && e > s ? text.slice(s, e + 1) : null;
  })();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : null;
  } catch { return null; }
}

/** Extract text content from a Gemini API response payload. */
export function extractGeminiText(payload: Record<string, unknown>): string {
  const candidates = (payload as any)?.candidates;
  if (!Array.isArray(candidates)) return '';
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('\n').trim();
}

/**
 * Normalize a raw category string against a list of valid categories.
 * Case-insensitive match. Returns last element of validCategories as fallback.
 */
export function normalizeToCategory(raw: string, validCategories: string[]): string {
  const lower = raw?.trim().toLowerCase();
  const match = validCategories.find(c => c.toLowerCase() === lower);
  return match ?? validCategories[validCategories.length - 1];
}

/**
 * Normalize a raw priority string against a list of valid priorities.
 * Case-insensitive match. Returns last element of validPriorities as fallback.
 */
export function normalizeToPriority(raw: string, validPriorities: string[]): string {
  const lower = raw?.trim().toLowerCase();
  const match = validPriorities.find(p => p.toLowerCase() === lower);
  return match ?? validPriorities[validPriorities.length - 1];
}

/** Extract error message from unknown thrown value. */
export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
