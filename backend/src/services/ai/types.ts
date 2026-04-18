// ─── Shared types across all service modules ─────────────────────────────────
// Kept domain-agnostic — no hardcoded category/priority values here.

export type SlaRisk        = 'High Risk' | 'Medium Risk' | 'Low Risk';
export type ProcessingStatus = 'Success' | 'Rejected' | 'Needs Review';

export interface MLResult {
  category:      string;
  confidence:    number;
  probabilities: Record<string, number>;
  source:        'ml_model';
}

export interface KeywordResult {
  category:   string;  // 'Unknown' when no match
  confidence: number;
  topKeyword: string | null;
}

export interface GeminiResult {
  category:           string;
  priority:           string;
  urgency_score:      number;
  confidence:         number;
  spam:               boolean;
  recommended_actions: string[];
  source:             'gemini' | 'fallback';
}

export interface ComplaintOutput {
  status:              ProcessingStatus;
  reason?:             string;
  category?:           string;
  priority?:           string;
  urgency_score?:      number;
  sla_risk?:           SlaRisk;
  recommended_actions?: string[];
  reasoning?:          string;
  confidence?:         number;
  pattern_alert?:      string | null;
  escalation?:         string;
}

export interface ServiceConfig {
  geminiApiKey?:        string;
  geminiModel?:         string;
  geminiApiBaseUrl?:    string;
  requestTimeoutMs?:    number;
  enableLogs?:          boolean;
  fetchImpl?:           typeof fetch;
  /** Override default urgency signals for a different domain */
  urgencySignals?:      Array<[string, number]>;
  /** Override default recommended actions for a different domain */
  recommendedActions?:  Record<string, Record<string, string>>;
  /** Category that gets lowest priority when no urgency signals present */
  lowPriorityCategory?: string;
}
