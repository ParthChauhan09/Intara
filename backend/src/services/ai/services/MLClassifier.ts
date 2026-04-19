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

  constructor() {
    try {
      this.classifier = new TFIDFClassifier();
    } catch {
      this.classifier = null;
    }
  }

  classify(text: string): MLResult | null {
    if (!this.classifier) return null;
    return this.classifier.predict(text);
  }
}
