import type { Complaint } from "@/lib/state/ComplaintsManager";

export type RecurringIssue = {
  label: string;       // human-readable e.g. "product leakage"
  count: number;       // number of complaints matched
  userCount: number;   // unique users
  category: string;
  severity: "critical" | "warning" | "info";
};

// Keyword clusters — phrase → display label, aligned with backend constants.ts
const ISSUE_CLUSTERS: Array<{ label: string; category: string; phrases: string[] }> = [
  // ── Product health/safety ──────────────────────────────────────────────────
  {
    label: "allergic reaction / rashes",
    category: "Product",
    phrases: ["allergic reaction", "allerg", "rash", "rashes", "skin reaction", "itching", "hives"],
  },
  {
    label: "nausea / vomiting",
    category: "Product",
    phrases: ["nausea", "vomiting", "vomit", "threw up", "sick after"],
  },
  {
    label: "food poisoning",
    category: "Product",
    phrases: ["food poisoning", "food poison", "poisoning"],
  },
  {
    label: "breathing difficulty",
    category: "Product",
    phrases: ["breathing difficulty", "breathing problem", "can't breathe", "shortness of breath"],
  },
  {
    label: "contaminated product",
    category: "Product",
    phrases: ["contaminated", "contamination", "foreign particle", "foreign object", "foreign material"],
  },
  {
    label: "expired product",
    category: "Product",
    phrases: ["expired", "expiry", "expiration", "past expiry", "past expiration"],
  },
  {
    label: "wrong product / item",
    category: "Product",
    phrases: ["wrong product", "wrong item", "incorrect product", "incorrect item", "received wrong"],
  },
  {
    label: "product discoloration / bad smell",
    category: "Product",
    phrases: ["discolor", "changed color", "colour changed", "smells bad", "bad smell", "foul smell", "strange smell"],
  },
  {
    label: "side effects / adverse reaction",
    category: "Product",
    phrases: ["side effect", "adverse reaction", "adverse effect", "reaction after", "symptoms after"],
  },
  {
    label: "defective / not working product",
    category: "Product",
    phrases: ["defective", "not working", "stopped working", "malfunctioning", "malfunction", "faulty", "product failure"],
  },
  // ── Packaging ─────────────────────────────────────────────────────────────
  {
    label: "product leakage",
    category: "Packaging",
    phrases: ["leaking", "leaked", "leak", "spilled", "spill", "liquid spill"],
  },
  {
    label: "broken / damaged seal",
    category: "Packaging",
    phrases: ["seal broken", "broken seal", "seal was broken", "seal open", "open seal", "tampered", "tamper"],
  },
  {
    label: "damaged packaging / box",
    category: "Packaging",
    phrases: ["box broken", "box was broken", "broken box", "damaged packaging", "packaging damaged", "carton crushed", "carton damaged", "pouch damaged"],
  },
  {
    label: "cracked / broken bottle",
    category: "Packaging",
    phrases: ["bottle cracked", "cracked bottle", "broken bottle", "cracked", "punctured"],
  },
  {
    label: "missing label / barcode",
    category: "Packaging",
    phrases: ["label missing", "barcode missing", "no label", "missing label"],
  },
  // ── Trade ─────────────────────────────────────────────────────────────────
  {
    label: "bulk order / pricing issues",
    category: "Trade",
    phrases: ["bulk order", "bulk pricing", "bulk purchase", "pricing inquiry", "price inquiry", "quotation"],
  },
];

const WINDOW_DAYS = 60;   // look-back window
const MIN_COUNT   = 3;    // minimum complaints to trigger an alert

function matchesClusters(
  description: string,
  phrases: string[]
): boolean {
  const lower = description.toLowerCase();
  return phrases.some((p) => lower.includes(p));
}

export function detectRecurringIssues(complaints: Complaint[]): RecurringIssue[] {
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const recent = complaints.filter(
    (c) => new Date(c.createdAt).getTime() >= cutoff
  );

  const results: RecurringIssue[] = [];

  for (const cluster of ISSUE_CLUSTERS) {
    const matched = recent.filter((c) =>
      matchesClusters(c.description, cluster.phrases)
    );

    if (matched.length < MIN_COUNT) continue;

    const uniqueUsers = new Set(matched.map((c) => c.userId)).size;

    // severity based on count + category
    let severity: RecurringIssue["severity"] = "info";
    if (cluster.category === "Product" && matched.length >= 5) severity = "critical";
    else if (cluster.category === "Product" || matched.length >= 5) severity = "warning";

    results.push({
      label: cluster.label,
      count: matched.length,
      userCount: uniqueUsers,
      category: cluster.category,
      severity,
    });
  }

  // sort: critical first, then by count desc
  return results.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return b.count - a.count;
  });
}
