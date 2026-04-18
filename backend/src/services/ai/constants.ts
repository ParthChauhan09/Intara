/**
 * constants.ts
 * All hardcoded domain values for the complaint classification system.
 * Trained on TS-PS14.csv (50,000 rows, 9 complaint types).
 *
 * To adapt this system to a different domain, replace these constants
 * or pass overrides via ServiceConfig.
 */

import type { } from './types.js'; // types imported for reference only

// ─── Default categories and priorities ───────────────────────────────────────
export const DEFAULT_CATEGORIES = ['Product', 'Packaging', 'Trade', 'Invalid'] as const;
export const DEFAULT_PRIORITIES = ['High', 'Medium', 'Low'] as const;

/** Category that gets Low priority when no urgency signals are present. */
export const LOW_PRIORITY_CATEGORY = 'Trade';

// ─── Ensemble weights ─────────────────────────────────────────────────────────
export const WEIGHTS = {
  ML_DEFAULT:      0.55,
  GEMINI_DEFAULT:  0.35,
  KEYWORD:         0.10,
  GEMINI_OVERRIDE: 0.55, // when Gemini strongly disagrees with ML
  ML_OVERRIDE:     0.35, // ML weight when Gemini overrides
  FALLBACK_GEMINI: 0.15, // when Gemini is in fallback mode
} as const;

// ─── Confidence thresholds ────────────────────────────────────────────────────
export const THRESHOLDS = {
  GEMINI_OVERRIDE_CONFIDENCE:  0.80, // Gemini confidence needed to override ML
  SPAM_ML_CONFIDENCE:          0.45, // ML below this + no keyword + low Gemini = Needs Review
  SPAM_GEMINI_CONFIDENCE:      0.60,
  AGREEMENT_BOOST_ALL:         0.08,
  AGREEMENT_BOOST_TWO:         0.04,
  URGENCY_HIGH:                0.55, // urgency score → High Risk SLA (lowered from 0.65)
  URGENCY_MEDIUM:              0.40, // urgency score → Medium Risk SLA
  PRIORITY_UPGRADE_URGENCY:    0.60, // urgency score that upgrades Medium → High (lowered from 0.70)
  CRITICAL_SIGNAL_OVERRIDE:    0.85, // signal score that forces High priority
  ESCALATE_IMMEDIATELY_URGENCY: 0.75,
} as const;

// ─── Urgency signals (phrase → score 0-1) ────────────────────────────────────
// Derived from domain knowledge — priority in TS-PS14.csv is uniformly random
export const URGENCY_SIGNALS: Array<[string, number]> = [
  // Critical health/safety — always High Risk
  ['emergency',          1.00], ['life threatening',   1.00],
  ['hospital',           0.95], ['doctor',             0.90],
  ['allergic reaction',  0.95], ['contaminated',       0.95],
  ['unsafe',             0.95], ['food poisoning',     0.95],
  ['breathing',          0.95], ['breathing difficulty', 0.95],
  ['child',              0.90], ['pregnant',           0.90],
  ['vomiting',           0.90], ['nausea',             0.85],
  ['side effect',        0.85], ['adverse reaction',   0.90],
  ['tampered',           0.90], ['foreign particles',  0.90],
  ['feeling unwell',     0.85], ['unwell',             0.80],
  ['reaction',           0.80], ['symptoms',           0.80],
  ['food supplement',    0.75], ['herbal tonic',       0.70],
  // High urgency — product/packaging failures
  ['urgent',             0.85], ['immediately',        0.85],
  ['asap',               0.80], ['critical',           0.80],
  ['defective',          0.70], ['malfunctioning',     0.75],
  ['stopped working',    0.70], ['not working',        0.70],
  ['seal broken',        0.80], ['seal was broken',    0.80],
  ['seal open',          0.80], ['open seal',          0.80],
  ['leaking',            0.75], ['leaked',             0.75],
  ['box was broken',     0.75], ['box broken',         0.75],
  ['carton crushed',     0.75], ['bottle cracked',     0.75],
  ['damaged',            0.65], ['broken',             0.65],
  ['expired',            0.80], ['smells bad',         0.75],
  ['changed color',      0.75], ['discolored',         0.75],
  ['wrong product',      0.65], ['wrong item',         0.65],
  // Medium urgency
  ['refund',             0.55], ['replacement',        0.55],
  ['escalate',           0.60], ['delay',              0.45],
  ['not resolved',       0.55], ['follow up',          0.45],
  ['poor quality',       0.50], ['quality issue',      0.50],
  ['angry',              0.55], ['very angry',         0.60],
];

// ─── Recommended actions per category + priority ──────────────────────────────
export const RECOMMENDED_ACTIONS: Record<string, Record<string, string>> = {
  Product: {
    High:   'Escalate to QA immediately. Capture batch number, symptoms, purchase date. Place batch on watchlist.',
    Medium: 'Assign to product support. Collect batch details and customer evidence. Initiate QA review.',
    Low:    'Log product complaint. Request details and route to standard product support queue.',
  },
  Packaging: {
    High:   'Trigger urgent packaging audit. Request photos of damage/seal. Isolate affected batch. Arrange replacement.',
    Medium: 'Assign to packaging team. Collect photos and courier trail. Offer replacement after verification.',
    Low:    'Log packaging complaint. Request evidence and route to standard packaging support queue.',
  },
  Trade: {
    High:   'Escalate to regional sales manager. Resolve trade/distributor issue same day.',
    Medium: 'Route to trade support with retailer/PO details. Schedule follow-up within 24 hours.',
    Low:    'Forward to sales team for bulk/pricing inquiry. Standard trade support workflow.',
  },
  Invalid: {
    High:   'Route to manual review queue.',
    Medium: 'Route to manual review queue.',
    Low:    'Route to manual review queue.',
  },
};

// ─── Dataset-trained lookup (TS-PS14.csv) ────────────────────────────────────
// Format: [phrase, category, base_severity_weight]
export const DATASET_TRAINED_LOOKUP: Array<[string, string, number]> = [
  ['product stopped working',  'Product',   0.65],
  ['product malfunctioning',   'Product',   0.75],
  ['defective item received',  'Product',   0.70],
  ['box was broken',           'Packaging', 0.80],
  ['damaged packaging',        'Packaging', 0.70],
  ['poor packaging quality',   'Packaging', 0.55],
  ['need bulk order details',  'Trade',     0.40],
  ['inquiry about pricing',    'Trade',     0.35],
  ['trade-related query',      'Trade',     0.30],
  ['trade related query',      'Trade',     0.30],
];

// ─── Extended keyword map ─────────────────────────────────────────────────────
// Format: [phrase, category, weight]
export const KEYWORD_CATEGORY_MAP: Array<[string, string, number]> = [
  // Product
  ['stopped working',        'Product',   0.65],
  ['not working',            'Product',   0.65],
  ['malfunctioning',         'Product',   0.75],
  ['malfunction',            'Product',   0.70],
  ['defective item',         'Product',   0.70],
  ['defective product',      'Product',   0.70],
  ['defective',              'Product',   0.65],
  ['faulty product',         'Product',   0.70],
  ['faulty item',            'Product',   0.70],
  ['faulty',                 'Product',   0.60],
  ['product not working',    'Product',   0.75],
  ['item not working',       'Product',   0.75],
  ['device not working',     'Product',   0.70],
  ['product failure',        'Product',   0.75],
  ['product broken',         'Product',   0.75],
  ['item broken',            'Product',   0.70],
  ['broken product',         'Product',   0.75],
  ['product quality issue',  'Product',   0.65],
  ['quality issue',          'Product',   0.55],
  ['expired product',        'Product',   0.80],
  ['wrong product',          'Product',   0.65],
  ['wrong item',             'Product',   0.65],
  ['contaminated',           'Product',   0.90],
  ['side effect',            'Product',   0.90],
  ['adverse reaction',       'Product',   0.95],
  ['allergic reaction',      'Product',   0.95],
  ['nausea',                 'Product',   0.90],
  ['vomiting',               'Product',   0.95],
  ['health issue',           'Product',   0.90],
  ['feeling unwell',         'Product',   0.85],
  ['unwell',                 'Product',   0.80],
  ['unsafe product',         'Product',   0.95],
  ['foreign particles',      'Product',   0.95],
  ['foreign particle',       'Product',   0.95],
  ['smells bad',             'Product',   0.80],
  ['bad smell',              'Product',   0.80],
  ['changed color',          'Product',   0.80],
  ['discolored',             'Product',   0.80],
  ['expired',                'Product',   0.85],
  ['expired product',        'Product',   0.85],
  ['food poisoning',         'Product',   0.95],
  ['breathing difficulty',   'Product',   0.95],
  ['reaction',               'Product',   0.75],
  ['symptoms',               'Product',   0.75],
  // Packaging
  ['box was broken',         'Packaging', 0.90],
  ['box broken',             'Packaging', 0.90],
  ['broken box',             'Packaging', 0.90],
  ['broken seal',            'Packaging', 0.90],
  ['broken lid',             'Packaging', 0.80],
  ['broken cap',             'Packaging', 0.80],
  ['damaged packaging',      'Packaging', 0.85],
  ['packaging damaged',      'Packaging', 0.85],
  ['poor packaging',         'Packaging', 0.65],
  ['packaging quality',      'Packaging', 0.65],
  ['bad packaging',          'Packaging', 0.65],
  ['packaging issue',        'Packaging', 0.65],
  ['seal broken',            'Packaging', 0.90],
  ['seal was broken',        'Packaging', 0.90],
  ['seal open',              'Packaging', 0.90],
  ['seal was open',          'Packaging', 0.90],
  ['open seal',              'Packaging', 0.90],
  ['tampered',               'Packaging', 0.90],
  ['tamper',                 'Packaging', 0.85],
  ['leaking',                'Packaging', 0.85],
  ['leaked',                 'Packaging', 0.85],
  ['leak',                   'Packaging', 0.80],
  ['spilled',                'Packaging', 0.80],
  ['cracked',                'Packaging', 0.75],
  ['punctured',              'Packaging', 0.85],
  ['pouch damaged',          'Packaging', 0.80],
  ['pouch open',             'Packaging', 0.85],
  ['pouch',                  'Packaging', 0.65],  // lowered — too generic
  ['carton damaged',         'Packaging', 0.80],
  ['carton crushed',         'Packaging', 0.85],
  ['bottle cracked',         'Packaging', 0.85],
  ['label missing',          'Packaging', 0.60],
  ['barcode missing',        'Packaging', 0.60],
  ['lid broken',             'Packaging', 0.80],
  ['cap broken',             'Packaging', 0.80],
  ['packaging',              'Packaging', 0.45],  // lowered — too generic alone
  // Trade
  ['bulk order',             'Trade',     0.40],
  ['bulk pricing',           'Trade',     0.35],
  ['bulk purchase',          'Trade',     0.40],
  ['pricing inquiry',        'Trade',     0.35],
  ['price inquiry',          'Trade',     0.35],
  ['inquiry about pricing',  'Trade',     0.35],
  ['pricing query',          'Trade',     0.30],
  ['trade query',            'Trade',     0.30],
  ['trade inquiry',          'Trade',     0.35],
  ['distributor',            'Trade',     0.40],
  ['wholesale',              'Trade',     0.40],
  ['retailer',               'Trade',     0.35],
  ['dealer',                 'Trade',     0.35],
  ['stockist',               'Trade',     0.40],
  ['purchase order',         'Trade',     0.40],
  ['invoice',                'Trade',     0.40],
  ['bulk',                   'Trade',     0.35],
  ['quotation',              'Trade',     0.35],
  ['rate list',              'Trade',     0.30],
  ['catalogue',              'Trade',     0.30],
  ['trade scheme',           'Trade',     0.35],
  ['margin',                 'Trade',     0.35],
];

// ─── Default category base weights ───────────────────────────────────────────
export const DEFAULT_CATEGORY_BASE_WEIGHTS: Record<string, number> = {
  Product:   0.65,
  Packaging: 0.65,
  Trade:     0.35,
  Invalid:   0.30,
};
