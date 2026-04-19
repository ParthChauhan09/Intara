/**
 * KeywordClassifier.ts
 * Weighted keyword-based category classification.
 * Domain keywords live in constants.ts — this class is logic only.
 */

import type { KeywordResult } from '../types.js';
import { phraseMatch, clamp } from '../utils/Utility.js';
import { DATASET_TRAINED_LOOKUP, KEYWORD_CATEGORY_MAP, DEFAULT_CATEGORY_BASE_WEIGHTS } from '../constants.js';

export class KeywordClassifier {
  classify(text: string): KeywordResult {
    const lower  = text.toLowerCase();
    const scores: Record<string, number> = {};
    let topKeyword: string | null = null;
    let topScore = 0;

    for (const [phrase, category, weight] of KEYWORD_CATEGORY_MAP) {
      if (phraseMatch(lower, phrase)) {
        scores[category] = (scores[category] ?? 0) + weight;
        if (weight > topScore) { topScore = weight; topKeyword = phrase; }
      }
    }

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) return { category: 'Unknown', confidence: 0, topKeyword: null };

    const [bestCat, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const confidence = clamp(bestScore / total);
    return { category: bestCat, confidence, topKeyword };
  }

  getCategoryBaseWeight(text: string, category: string): number {
    const lower = text.toLowerCase();
    for (const [phrase, cat, weight] of DATASET_TRAINED_LOOKUP) {
      if (cat === category && lower.includes(phrase)) return weight;
    }
    for (const [phrase, cat, weight] of KEYWORD_CATEGORY_MAP) {
      if (cat === category && phraseMatch(lower, phrase)) return weight;
    }
    return DEFAULT_CATEGORY_BASE_WEIGHTS[category] ?? 0.5;
  }
}
