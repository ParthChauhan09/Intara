/**
 * accuracy_test.ts
 * Deep accuracy test based on the problem statement:
 * Wellness business complaint classification system.
 *
 * Tests cover:
 * 1. All 3 categories (Product / Packaging / Trade)
 * 2. All 3 priorities (High / Medium / Low)
 * 3. Real-world complaint text from call centres, emails, direct communication
 * 4. Edge cases, ambiguous inputs, multi-signal inputs
 * 5. Spam / invalid inputs
 * 6. SLA risk alignment
 * 7. Escalation logic
 * 8. Recommended action specificity
 *
 * Run: GEMINI_API_KEY=... npx tsx integration/accuracy_test.ts
 */

import { ComplaintAIService } from './ComplaintAIService.js';
import type { ComplaintOutput } from './types.js';

const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel:  process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  enableLogs:   false,
};

const CATEGORIES = ['Product', 'Packaging', 'Trade', 'Invalid'];
const PRIORITIES  = ['High', 'Medium', 'Low'];

// ─── Test case definition ─────────────────────────────────────────────────────
interface TestCase {
  id:                 string;
  input:              string;
  expectedCategory:   string;
  expectedPriority?:  string;
  expectedSlaRisk?:   string;
  expectedEscalation?: string;
  mustContainAction?: string;   // keyword that must appear in recommended_action
  source:             string;   // call / email / direct
  notes?:             string;
}

const TEST_CASES: TestCase[] = [

  // ══════════════════════════════════════════════════════════════════
  // SECTION 1: PRODUCT COMPLAINTS — from call centre
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'P-01', source: 'call',
    input: 'Customer called saying the protein powder capsule caused severe nausea and vomiting after consumption',
    expectedCategory: 'Product', expectedPriority: 'High', expectedSlaRisk: 'High Risk',
    mustContainAction: 'QA', notes: 'Health/safety — must escalate immediately',
  },
  {
    id: 'P-02', source: 'call',
    input: 'The wellness supplement tablet has changed color and smells bad, customer suspects it is expired',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Expired product — high risk',
  },
  {
    id: 'P-03', source: 'email',
    input: 'I purchased your herbal tonic last week and after taking it I developed an allergic reaction with rash on my skin',
    expectedCategory: 'Product', expectedPriority: 'High', expectedSlaRisk: 'High Risk',
    notes: 'Allergic reaction — critical',
  },
  {
    id: 'P-04', source: 'email',
    input: 'The product I received is completely defective and stopped working after just one use',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Defective + stopped working',
  },
  {
    id: 'P-05', source: 'direct',
    input: 'Product malfunctioning since day one, need urgent replacement immediately',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Malfunctioning + urgent',
  },
  {
    id: 'P-06', source: 'email',
    input: 'The supplement powder has foreign particles in it, I am very concerned about safety',
    expectedCategory: 'Product', expectedPriority: 'High',
    mustContainAction: 'QA', notes: 'Foreign particles — safety critical',
  },
  {
    id: 'P-07', source: 'call',
    input: 'Customer says the product quality is very poor and it stopped working after a week',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Quality + stopped working',
  },
  {
    id: 'P-08', source: 'email',
    input: 'I received the wrong product in my order, this is not what I ordered',
    expectedCategory: 'Product', expectedPriority: 'Medium',
    notes: 'Wrong product — medium priority',
  },
  {
    id: 'P-09', source: 'direct',
    input: 'The item I received has a defect, requesting replacement',
    expectedCategory: 'Product', expectedPriority: 'Medium',
    notes: 'Defective item — medium',
  },
  {
    id: 'P-10', source: 'call',
    input: 'Product stopped working, please help resolve this issue',
    expectedCategory: 'Product',
    notes: 'Dataset exact phrase',
  },
  {
    id: 'P-11', source: 'email',
    input: 'My child consumed the supplement and is now feeling unwell, please advise urgently',
    expectedCategory: 'Product', expectedPriority: 'High', expectedSlaRisk: 'High Risk',
    notes: 'Child + unwell — critical safety',
  },
  {
    id: 'P-12', source: 'call',
    input: 'Customer reports the capsule caused breathing difficulty after consumption',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Breathing difficulty — life threatening',
  },

  // ══════════════════════════════════════════════════════════════════
  // SECTION 2: PACKAGING COMPLAINTS — from email/call
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'K-01', source: 'call',
    input: 'The box was completely broken when I received the delivery, product inside was damaged',
    expectedCategory: 'Packaging', expectedPriority: 'High',
    notes: 'Box broken — high priority',
  },
  {
    id: 'K-02', source: 'email',
    input: 'Packaging was damaged during delivery, the seal was tampered and product may be contaminated',
    expectedCategory: 'Packaging', expectedPriority: 'High', expectedSlaRisk: 'High Risk',
    notes: 'Tampered seal — critical',
  },
  {
    id: 'K-03', source: 'direct',
    input: 'The pouch was leaking and the powder spilled everywhere inside the delivery box',
    expectedCategory: 'Packaging', expectedPriority: 'High',
    notes: 'Leaking pouch',
  },
  {
    id: 'K-04', source: 'email',
    input: 'Poor packaging quality, the carton was crushed and the bottle inside cracked',
    expectedCategory: 'Packaging', expectedPriority: 'High',
    notes: 'Carton crushed + bottle cracked',
  },
  {
    id: 'K-05', source: 'call',
    input: 'The seal on the bottle was already open when I received it, I am worried about product safety',
    expectedCategory: 'Packaging', expectedPriority: 'High',
    notes: 'Open seal — safety concern',
  },
  {
    id: 'K-06', source: 'email',
    input: 'Damaged packaging received, the outer box has dents and the label is torn',
    expectedCategory: 'Packaging', expectedPriority: 'Medium',
    notes: 'Damaged packaging — medium',
  },
  {
    id: 'K-07', source: 'direct',
    input: 'The packaging quality is very poor, box arrived with scratches and minor damage',
    expectedCategory: 'Packaging', expectedPriority: 'Medium',
    notes: 'Poor quality — medium',
  },
  {
    id: 'K-08', source: 'call',
    input: 'Barcode on the package is missing and the batch number label is not visible',
    expectedCategory: 'Packaging', expectedPriority: 'Medium',
    notes: 'Missing label/barcode',
  },
  {
    id: 'K-09', source: 'email',
    input: 'The lid of the container was broken and the cap was cracked upon delivery',
    expectedCategory: 'Packaging',
    notes: 'Broken lid/cap',
  },
  {
    id: 'K-10', source: 'direct',
    input: 'Box was broken during transit, need replacement packaging',
    expectedCategory: 'Packaging',
    notes: 'Dataset exact phrase variation',
  },

  // ══════════════════════════════════════════════════════════════════
  // SECTION 3: TRADE COMPLAINTS — from email/direct
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'T-01', source: 'email',
    input: 'I need bulk order details for our pharmacy chain, we want to place a large order',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Bulk order inquiry — low priority',
  },
  {
    id: 'T-02', source: 'direct',
    input: 'Inquiry about pricing for wholesale distribution of your wellness products',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Pricing inquiry — low',
  },
  {
    id: 'T-03', source: 'email',
    input: 'We are a distributor and want to know about trade margins and distributor schemes',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Distributor inquiry',
  },
  {
    id: 'T-04', source: 'direct',
    input: 'Trade-related query about GST invoice and purchase order process for retailers',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Trade query — GST/invoice',
  },
  {
    id: 'T-05', source: 'email',
    input: 'Need bulk order details and rate list for our stockist network across Gujarat',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Bulk + rate list',
  },
  {
    id: 'T-06', source: 'call',
    input: 'Retailer asking about product catalogue and wholesale pricing for new store',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Retailer catalogue inquiry',
  },
  {
    id: 'T-07', source: 'email',
    input: 'Want to become an authorized dealer, need information about dealership and margins',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Dealer inquiry',
  },
  {
    id: 'T-08', source: 'direct',
    input: 'Need quotation for bulk purchase of 500 units for our wellness centre',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    notes: 'Quotation request',
  },

  // ══════════════════════════════════════════════════════════════════
  // SECTION 4: MULTI-SIGNAL / AMBIGUOUS EDGE CASES
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'E-01', source: 'call',
    input: 'The product quality is poor and the packaging was also damaged when delivered',
    expectedCategory: 'Product',
    notes: 'Both product + packaging signals — product should win (quality issue)',
  },
  {
    id: 'E-02', source: 'email',
    input: 'I want to place a bulk order but the last shipment had damaged packaging',
    expectedCategory: 'Trade',
    notes: 'Trade + packaging — trade intent is primary',
  },
  {
    id: 'E-03', source: 'direct',
    input: 'The supplement caused side effects and the packaging seal was also broken',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Side effects (Product) + broken seal (Packaging) — Product wins due to health risk',
  },
  {
    id: 'E-04', source: 'email',
    input: 'Customer is very angry and wants an immediate refund for the defective product',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Angry + refund + defective',
  },
  {
    id: 'E-05', source: 'call',
    input: 'The product stopped working and we need to escalate this to the quality team asap',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Stopped working + escalate + asap',
  },
  {
    id: 'E-06', source: 'email',
    input: 'Received damaged packaging with poor quality product inside, need replacement urgently',
    expectedCategory: 'Packaging',
    notes: 'Damaged packaging primary signal',
  },
  {
    id: 'E-07', source: 'direct',
    input: 'The food supplement caused food poisoning symptoms in my family member',
    expectedCategory: 'Product', expectedPriority: 'High', expectedSlaRisk: 'High Risk',
    notes: 'Food poisoning — critical',
  },
  {
    id: 'E-08', source: 'email',
    input: 'Pregnant customer reports adverse reaction after consuming the herbal supplement',
    expectedCategory: 'Product', expectedPriority: 'High',
    notes: 'Pregnant + adverse reaction — critical',
  },

  // ══════════════════════════════════════════════════════════════════
  // SECTION 5: SLA AND ESCALATION VERIFICATION
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'S-01', source: 'call',
    input: 'URGENT: Customer in hospital after consuming our product, needs immediate attention',
    expectedCategory: 'Product', expectedPriority: 'High',
    expectedSlaRisk: 'High Risk', expectedEscalation: 'Escalate immediately',
    notes: 'Hospital + urgent — must escalate immediately',
  },
  {
    id: 'S-02', source: 'email',
    input: 'Product quality issue, requesting follow up on my previous complaint that was not resolved',
    expectedCategory: 'Product', expectedPriority: 'Medium',
    expectedEscalation: 'Assign to support agent',
    notes: 'Not resolved + follow up — medium, assign to agent',
  },
  {
    id: 'S-03', source: 'direct',
    input: 'Need bulk order details for next quarter procurement',
    expectedCategory: 'Trade', expectedPriority: 'Low',
    expectedSlaRisk: 'Low Risk', expectedEscalation: 'Standard workflow',
    notes: 'Routine trade — standard workflow',
  },

  // ══════════════════════════════════════════════════════════════════
  // SECTION 6: SPAM / INVALID INPUTS
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'X-01', source: 'direct',
    input: 'asdf!!!',
    expectedCategory: 'Invalid', notes: 'Gibberish',
  },
  {
    id: 'X-02', source: 'direct',
    input: 'hi',
    expectedCategory: 'Invalid', notes: 'Too short',
  },
  {
    id: 'X-03', source: 'direct',
    input: '12345678',
    expectedCategory: 'Invalid', notes: 'Numbers only',
  },
  {
    id: 'X-04', source: 'direct',
    input: '!!!###@@@$$$',
    expectedCategory: 'Invalid', notes: 'Symbols only',
  },
  {
    id: 'X-05', source: 'direct',
    input: 'xkzqwpvbmnrt',
    expectedCategory: 'Invalid', notes: 'No vowels — gibberish',
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

interface TestResult {
  id:       string;
  source:   string;
  input:    string;
  passed:   boolean;
  failures: string[];
  output:   ComplaintOutput;
  notes?:   string;
}

async function runTests(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Wellness Complaint AI — Deep Accuracy Test                 ║');
  console.log('║   Based on Problem Statement: Product/Packaging/Trade        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  let passed = 0, failed = 0, skipped = 0;

  // Group by section
  const sections: Record<string, TestCase[]> = {};
  for (const tc of TEST_CASES) {
    const section = tc.id.split('-')[0];
    if (!sections[section]) sections[section] = [];
    sections[section].push(tc);
  }

  const sectionNames: Record<string, string> = {
    P: 'PRODUCT COMPLAINTS',
    K: 'PACKAGING COMPLAINTS',
    T: 'TRADE COMPLAINTS',
    E: 'EDGE CASES',
    S: 'SLA & ESCALATION',
    X: 'SPAM / INVALID',
  };

  for (const [section, cases] of Object.entries(sections)) {
    console.log(`\n── ${sectionNames[section] ?? section} (${cases.length} tests) ──`);

    for (const tc of cases) {
      let output: ComplaintOutput;
      try {
        output = await ComplaintAIService.process(tc.input, CATEGORIES, PRIORITIES, CONFIG);
      } catch (e) {
        console.log(`  ⚠ ${tc.id} ERROR: ${e}`);
        skipped++;
        continue;
      }

      const failures: string[] = [];
      const actualCat = output.status === 'Rejected' || output.status === 'Needs Review'
        ? 'Invalid'
        : output.category ?? 'Invalid';

      // Category check
      if (actualCat !== tc.expectedCategory) {
        failures.push(`category=${actualCat} (expected ${tc.expectedCategory})`);
      }

      // Priority check
      if (tc.expectedPriority && output.priority !== tc.expectedPriority) {
        failures.push(`priority=${output.priority} (expected ${tc.expectedPriority})`);
      }

      // SLA risk check
      if (tc.expectedSlaRisk && output.sla_risk !== tc.expectedSlaRisk) {
        failures.push(`sla_risk=${output.sla_risk} (expected ${tc.expectedSlaRisk})`);
      }

      // Escalation check
      if (tc.expectedEscalation && output.escalation !== tc.expectedEscalation) {
        failures.push(`escalation="${output.escalation}" (expected "${tc.expectedEscalation}")`);
      }

      // Recommended action keyword check
      if (tc.mustContainAction && output.recommended_actions && output.recommended_actions.length > 0) {
        const actionStr = output.recommended_actions.join(' ');
        if (!actionStr.toLowerCase().includes(tc.mustContainAction.toLowerCase())) {
          failures.push(`action missing "${tc.mustContainAction}": "${actionStr.slice(0, 60)}"`);
        }
      }

      const ok = failures.length === 0;
      if (ok) passed++; else failed++;

      const icon = ok ? '✓' : '✗';
      const src  = `[${tc.source}]`.padEnd(8);
      console.log(`  ${icon} ${tc.id} ${src} ${tc.input.slice(0, 55)}${tc.input.length > 55 ? '…' : ''}`);
      if (!ok) {
        failures.forEach(f => console.log(`       ↳ ${f}`));
      }

      results.push({ id: tc.id, source: tc.source, input: tc.input, passed: ok, failures, output, notes: tc.notes });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  const total   = passed + failed;
  const pct     = ((passed / total) * 100).toFixed(1);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed}/${total} passed  (${pct}% accuracy)${' '.repeat(Math.max(0, 30 - pct.length))}║`);
  if (skipped > 0) console.log(`║  Skipped (errors): ${skipped}${' '.repeat(40)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Per-section breakdown
  console.log('\nPer-section breakdown:');
  for (const [section, cases] of Object.entries(sections)) {
    const sectionResults = results.filter(r => r.id.startsWith(section));
    const sp = sectionResults.filter(r => r.passed).length;
    const st = sectionResults.length;
    const bar = '█'.repeat(sp) + '░'.repeat(st - sp);
    console.log(`  ${sectionNames[section] ?? section}: ${sp}/${st} [${bar}]`);
  }

  // Failures detail
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(r => {
      console.log(`  ${r.id}: "${r.input.slice(0, 60)}"`);
      r.failures.forEach(f => console.log(`    → ${f}`));
      if (r.notes) console.log(`    note: ${r.notes}`);
    });
  }

  // Problem statement alignment check
  console.log('\nProblem statement alignment:');
  const productTests   = results.filter(r => r.id.startsWith('P'));
  const packagingTests = results.filter(r => r.id.startsWith('K'));
  const tradeTests     = results.filter(r => r.id.startsWith('T'));
  const spamTests      = results.filter(r => r.id.startsWith('X'));
  const slaTests       = results.filter(r => r.id.startsWith('S'));

  const pctOf = (arr: TestResult[]) => arr.length ? `${arr.filter(r => r.passed).length}/${arr.length} (${((arr.filter(r => r.passed).length / arr.length) * 100).toFixed(0)}%)` : 'n/a';

  console.log(`  ✦ Product classification:   ${pctOf(productTests)}`);
  console.log(`  ✦ Packaging classification: ${pctOf(packagingTests)}`);
  console.log(`  ✦ Trade classification:     ${pctOf(tradeTests)}`);
  console.log(`  ✦ Spam/invalid rejection:   ${pctOf(spamTests)}`);
  console.log(`  ✦ SLA & escalation:         ${pctOf(slaTests)}`);
  console.log(`  ✦ Edge cases:               ${pctOf(results.filter(r => r.id.startsWith('E')))}`);
  console.log('');
}

runTests().catch(console.error);
