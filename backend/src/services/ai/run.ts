/**
 * Interactive + batch tester for ComplaintAIService
 * Run: GEMINI_API_KEY=... npx tsx integration/run.ts
 *
 * Modes:
 *   --batch   : run all test cases and show accuracy report
 *   (default) : interactive REPL — type complaint, see output
 */

import * as readline from 'readline';
import { ComplaintAIService } from './ComplaintAIService.js';
import type { ComplaintOutput as ComplaintAIResult } from './types.js';

const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel:  process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  enableLogs:   false,
};

const CATEGORIES = ['Product', 'Packaging', 'Trade', 'Invalid'];
const PRIORITIES  = ['High', 'Medium', 'Low'];

// ─── Test cases derived from TS-PS14.csv + edge cases ────────────────────────
const TEST_CASES: Array<{ input: string; expectedCategory: string; expectedPriority?: string; label: string }> = [
  // ── Exact dataset phrases (should be 100% accurate) ──
  { input: 'Product stopped working',       expectedCategory: 'Product',   label: 'Dataset exact: Product stopped working' },
  { input: 'Product malfunctioning',        expectedCategory: 'Product',   label: 'Dataset exact: Product malfunctioning' },
  { input: 'Defective item received',       expectedCategory: 'Product',   label: 'Dataset exact: Defective item received' },
  { input: 'Box was broken',                expectedCategory: 'Packaging', label: 'Dataset exact: Box was broken' },
  { input: 'Damaged packaging',             expectedCategory: 'Packaging', label: 'Dataset exact: Damaged packaging' },
  { input: 'Poor packaging quality',        expectedCategory: 'Packaging', label: 'Dataset exact: Poor packaging quality' },
  { input: 'Need bulk order details',       expectedCategory: 'Trade',     label: 'Dataset exact: Need bulk order details' },
  { input: 'Inquiry about pricing',         expectedCategory: 'Trade',     label: 'Dataset exact: Inquiry about pricing' },
  { input: 'Trade-related query',           expectedCategory: 'Trade',     label: 'Dataset exact: Trade-related query' },

  // ── Real-world variations ──
  { input: 'My product stopped working after 2 days of use', expectedCategory: 'Product',   label: 'Variation: product stopped working' },
  { input: 'The item I received is completely defective',    expectedCategory: 'Product',   label: 'Variation: defective item' },
  { input: 'Product is malfunctioning, please help',        expectedCategory: 'Product',   label: 'Variation: malfunctioning' },
  { input: 'The box was broken when I received it',         expectedCategory: 'Packaging', label: 'Variation: box was broken' },
  { input: 'Packaging was damaged during delivery',         expectedCategory: 'Packaging', label: 'Variation: damaged packaging' },
  { input: 'The packaging quality is very poor',            expectedCategory: 'Packaging', label: 'Variation: poor packaging quality' },
  { input: 'I need bulk order details for my store',        expectedCategory: 'Trade',     label: 'Variation: bulk order details' },
  { input: 'Can you share pricing inquiry for wholesale',   expectedCategory: 'Trade',     label: 'Variation: pricing inquiry' },
  { input: 'I have a trade related query about margins',    expectedCategory: 'Trade',     label: 'Variation: trade related query' },

  // ── Priority edge cases ──
  { input: 'Product stopped working urgently need replacement immediately', expectedCategory: 'Product',   expectedPriority: 'High', label: 'Priority: urgent product' },
  { input: 'Box was broken, seal was tampered, product may be contaminated', expectedCategory: 'Packaging', expectedPriority: 'High', label: 'Priority: tampered packaging' },
  { input: 'Capsule caused allergic reaction and nausea',   expectedCategory: 'Product',   expectedPriority: 'High', label: 'Priority: health risk' },
  { input: 'Inquiry about pricing for bulk wholesale',      expectedCategory: 'Trade',     expectedPriority: 'Low',  label: 'Priority: low trade inquiry' },
  { input: 'Need bulk order details for distributor',       expectedCategory: 'Trade',     expectedPriority: 'Low',  label: 'Priority: low bulk order' },

  // ── Harder edge cases ──
  { input: 'The product I bought last week has completely stopped functioning', expectedCategory: 'Product',   label: 'Edge: stopped functioning' },
  { input: 'Item delivered was broken and not working at all',                  expectedCategory: 'Product',   label: 'Edge: broken item not working' },
  { input: 'Outer carton was crushed and the bottle inside cracked',            expectedCategory: 'Packaging', label: 'Edge: carton crushed bottle cracked' },
  { input: 'Seal on the pouch was open when I received it',                     expectedCategory: 'Packaging', label: 'Edge: seal open on pouch' },
  { input: 'Want to become a distributor and need wholesale pricing',           expectedCategory: 'Trade',     expectedPriority: 'Low', label: 'Edge: distributor wholesale pricing' },
  { input: 'Customer took the supplement and had severe vomiting',              expectedCategory: 'Product',   expectedPriority: 'High', label: 'Edge: health emergency' },
  { input: 'The packaging was leaking and product spilled everywhere',          expectedCategory: 'Packaging', expectedPriority: 'High', label: 'Edge: leaking packaging high priority' },
  { input: 'Need invoice and GST details for my purchase order',                expectedCategory: 'Trade',     expectedPriority: 'Low',  label: 'Edge: invoice GST trade' },
  { input: 'Product quality is very poor and it stopped working',               expectedCategory: 'Product',   label: 'Edge: quality + stopped working' },
  { input: 'Box arrived damaged and packaging was torn',                        expectedCategory: 'Packaging', label: 'Edge: box damaged packaging torn' },

  // ── Spam / invalid inputs ──
  { input: 'asdf!!!',          expectedCategory: 'Invalid', label: 'Spam: gibberish symbols' },
  { input: 'hi',               expectedCategory: 'Invalid', label: 'Spam: too short' },
  { input: 'xkzqwpvb',        expectedCategory: 'Invalid', label: 'Spam: no vowels' },
  { input: '12345',            expectedCategory: 'Invalid', label: 'Spam: numbers only' },
  { input: '!!!###@@@',        expectedCategory: 'Invalid', label: 'Spam: symbols only' },
];

// ─── Batch mode ───────────────────────────────────────────────────────────────

async function runBatch() {
  console.log('\n=== Batch Test — ComplaintAIService (TS-PS14.csv trained) ===\n');
  let passed = 0, failed = 0, skipped = 0;
  const failures: string[] = [];

  for (const tc of TEST_CASES) {
    let result: ComplaintAIResult;
    try {
      result = await ComplaintAIService.process(tc.input, CATEGORIES, PRIORITIES, CONFIG);
    } catch (e) {
      console.log(`  ERROR  ${tc.label}: ${e}`);
      skipped++;
      continue;
    }

    const actualCat = result.status === 'Rejected' ? 'Invalid' : result.category ?? 'Invalid';
    const catOk = actualCat === tc.expectedCategory;
    const priOk = !tc.expectedPriority || result.priority === tc.expectedPriority;
    const ok = catOk && priOk;

    const icon = ok ? '✓' : '✗';
    const priNote = tc.expectedPriority ? ` | priority=${result.priority}(exp:${tc.expectedPriority})` : '';
    console.log(`  ${icon} ${tc.label}`);
    if (!ok) {
      const msg = `    → got category=${actualCat} (expected ${tc.expectedCategory})${priNote}`;
      console.log(msg);
      failures.push(`${tc.label}: ${msg.trim()}`);
      failed++;
    } else {
      passed++;
    }
  }

  const total = passed + failed + skipped;
  const pct = ((passed / (total - skipped)) * 100).toFixed(1);
  console.log(`\n─────────────────────────────────────────`);
  console.log(`Results: ${passed}/${total - skipped} passed (${pct}% accuracy)`);
  if (skipped > 0) console.log(`Skipped (errors): ${skipped}`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(' ', f));
  }
  console.log('─────────────────────────────────────────\n');
}

// ─── Interactive mode ─────────────────────────────────────────────────────────

function printResult(result: ComplaintAIResult) {
  console.log('\n┌─────────────────────────────────────────────────────┐');
  console.log(`│  STATUS     : ${result.status}`);
  if (result.reason) {
    console.log(`│  REASON     : ${result.reason}`);
  }
  if (result.category) {
    console.log(`│  CATEGORY   : ${result.category}`);
    console.log(`│  PRIORITY   : ${result.priority}`);
    console.log(`│  URGENCY    : ${result.urgency_score}`);
    console.log(`│  SLA RISK   : ${result.sla_risk}`);
    console.log(`│  CONFIDENCE : ${result.confidence}`);
    console.log(`│  ESCALATION : ${result.escalation}`);
    if (result.pattern_alert) console.log(`│  ⚠ PATTERN  : ${result.pattern_alert}`);
    console.log(`│  ACTION     : ${result.recommended_actions?.join(' | ')}`);
    const r = String(result.reasoning ?? '');
    console.log(`│  REASONING  : ${r.length > 180 ? r.slice(0, 180) + '...' : r}`);
  }
  console.log('└─────────────────────────────────────────────────────┘\n');
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n=== Complaint AI Service — Interactive Tester ===');
  console.log('Dataset: TS-PS14.csv (50,000 rows | Product / Packaging / Trade)');
  console.log('Type "batch" to run all test cases, "exit" to quit.\n');

  const ask = () => {
    rl.question('Enter complaint: ', async (input) => {
      const text = input.trim();
      if (!text || text.toLowerCase() === 'exit') { console.log('Bye.'); rl.close(); return; }
      if (text.toLowerCase() === 'batch') { await runBatch(); ask(); return; }
      try {
        const result = await ComplaintAIService.process(text, CATEGORIES, PRIORITIES, CONFIG);
        printResult(result);
      } catch (e) {
        console.error('Error:', e instanceof Error ? e.message : e);
      }
      ask();
    });
  };
  ask();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (process.argv.includes('--batch')) {
  runBatch().catch(console.error);
} else {
  runInteractive().catch(console.error);
}
