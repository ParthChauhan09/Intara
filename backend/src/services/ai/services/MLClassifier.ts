/**
 * MLClassifier.ts
 * Instance class wrapping TFIDFClassifier.
 * Exposes classify() which runs TF-IDF + n-gram + softmax inference
 * using weights trained on TS-PS14.csv (50k rows, 100% CV accuracy).
 */

import { TFIDFClassifier } from '../TFIDFClassifier.js';
import type { MLResult } from '../types.js';

export class MLClassifier {
  private readonly classifier: TFIDFClassifier | null;
  private readonly log: (e: string, p?: unknown) => void;

  constructor(log: (e: string, p?: unknown) => void) {
    this.log = log;
    try {
      this.classifier = new TFIDFClassifier();
      this.log('MLClassifier.loaded', { status: 'ok' });
    } catch (e) {
      this.classifier = null;
      this.log('MLClassifier.loadFailed', { reason: e instanceof Error ? e.message : String(e) });
    }
  }

  /**
   * Runs TF-IDF vectorization (word n-grams 1-3 + char n-grams 3-5),
   * logistic regression decision function, and softmax to produce
   * per-class probabilities.
   */
  classify(text: string): MLResult | null {
    if (!this.classifier) return null;
    const result = this.classifier.predict(text);
    this.log('MLClassifier.classify', {
      category: result.category,
      confidence: result.confidence,
      probabilities: result.probabilities,
    });
    return result;
  }
}
