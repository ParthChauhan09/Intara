/**
 * TFIDFClassifier.ts
 * Native TypeScript implementation of the trained sklearn
 * TF-IDF (word + char n-gram) + Logistic Regression model.
 *
 * Loads weights from models/ts_model_weights.json — exported
 * directly from the Python model trained on TS-PS14.csv (50k rows).
 *
 * Replicates sklearn's exact TF-IDF transform + softmax inference.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Types ────────────────────────────────────────────────────

interface VectorizerWeights {
  vocabulary:   Record<string, number>;
  idf:          number[];
  ngram_range:  [number, number];
  sublinear_tf: boolean;
  analyzer:     string;
}

interface ModelWeights {
  classes:         string[];
  word_vec:        VectorizerWeights;
  char_vec:        VectorizerWeights;
  word_n_features: number;
  char_n_features: number;
  coef:            number[][];   // [n_classes, n_features]
  intercept:       number[];     // [n_classes]
}

export interface ClassifierResult {
  category:    string;
  confidence:  number;
  probabilities: Record<string, number>;
  source:      'ml_model';
}

// ─── TFIDFClassifier ──────────────────────────────────────────

export class TFIDFClassifier {
  private weights: ModelWeights;

  constructor(weightsPath?: string) {
    const p = weightsPath ?? resolve(process.cwd(), 'models/ts_model_weights.json');
    const raw = readFileSync(p, 'utf-8');
    this.weights = JSON.parse(raw) as ModelWeights;
  }

  // ── Public predict ────────────────────────────────────────────

  predict(text: string): ClassifierResult {
    const vec = this.transform(text);
    const logits = this.linearDecision(vec);
    const probs  = this.softmax(logits);

    const classes = this.weights.classes;
    let bestIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[bestIdx]) bestIdx = i;
    }

    const probMap: Record<string, number> = {};
    classes.forEach((c, i) => { probMap[c] = Math.round(probs[i] * 10000) / 10000; });

    return {
      category:      classes[bestIdx],
      confidence:    Math.round(probs[bestIdx] * 10000) / 10000,
      probabilities: probMap,
      source:        'ml_model',
    };
  }

  // ── TF-IDF transform (word + char, concatenated) ──────────────

  private transform(text: string): number[] {
    const wordVec = this.tfidfVector(text, this.weights.word_vec);
    const charVec = this.tfidfVector(text, this.weights.char_vec);
    return [...wordVec, ...charVec];
  }

  private tfidfVector(text: string, vec: VectorizerWeights): number[] {
    const tokens  = this.tokenize(text, vec);
    const tf      = this.termFrequency(tokens, vec.vocabulary);
    const tfidf   = new Array<number>(vec.idf.length).fill(0);
    let   norm    = 0;

    for (const [termIdx, rawTf] of Object.entries(tf)) {
      const idx = Number(termIdx);
      // sklearn sublinear_tf: tf = 1 + log(tf)
      const tfVal = vec.sublinear_tf ? 1 + Math.log(rawTf) : rawTf;
      const val   = tfVal * vec.idf[idx];
      tfidf[idx]  = val;
      norm       += val * val;
    }

    // L2 normalize (sklearn default)
    const l2 = Math.sqrt(norm);
    if (l2 > 0) {
      for (let i = 0; i < tfidf.length; i++) tfidf[i] /= l2;
    }

    return tfidf;
  }

  // ── Tokenization — mirrors sklearn's word and char_wb analyzers ──

  private tokenize(text: string, vec: VectorizerWeights): string[] {
    const lower = text.toLowerCase();

    if (vec.analyzer === 'char_wb') {
      return this.charNgrams(lower, vec.ngram_range[0], vec.ngram_range[1]);
    }
    // word analyzer
    return this.wordNgrams(lower, vec.ngram_range[0], vec.ngram_range[1]);
  }

  private wordNgrams(text: string, minN: number, maxN: number): string[] {
    // sklearn word tokenizer: split on non-alphanumeric, min length 2
    const words = text.match(/\b[a-z0-9][a-z0-9]+\b/g) ?? [];
    const ngrams: string[] = [];
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
      }
    }
    return ngrams;
  }

  private charNgrams(text: string, minN: number, maxN: number): string[] {
    // sklearn char_wb: pad with spaces, then extract char n-grams
    const padded = ` ${text} `;
    const ngrams: string[] = [];
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= padded.length - n; i++) {
        ngrams.push(padded.slice(i, i + n));
      }
    }
    return ngrams;
  }

  // ── Term frequency count ──────────────────────────────────────

  private termFrequency(
    tokens: string[],
    vocab:  Record<string, number>
  ): Record<number, number> {
    const tf: Record<number, number> = {};
    for (const token of tokens) {
      const idx = vocab[token];
      if (idx !== undefined) {
        tf[idx] = (tf[idx] ?? 0) + 1;
      }
    }
    return tf;
  }

  // ── Linear decision function: coef · x + intercept ───────────

  private linearDecision(vec: number[]): number[] {
    const { coef, intercept } = this.weights;
    return coef.map((row, i) => {
      let dot = intercept[i];
      for (let j = 0; j < row.length; j++) {
        if (vec[j] !== 0) dot += row[j] * vec[j];
      }
      return dot;
    });
  }

  // ── Softmax ───────────────────────────────────────────────────

  private softmax(logits: number[]): number[] {
    const max  = Math.max(...logits);
    const exps = logits.map(x => Math.exp(x - max));
    const sum  = exps.reduce((a, b) => a + b, 0);
    return exps.map(x => x / sum);
  }
}
