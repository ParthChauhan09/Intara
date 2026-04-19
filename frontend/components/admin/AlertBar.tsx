"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RecurringIssue } from "@/lib/detectRecurringIssues";

interface AlertBarProps {
  issues: RecurringIssue[];
}

const severityConfig = {
  critical: {
    bar: "bg-red-50 border-red-200",
    icon: "text-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    title: "text-red-900",
    meta: "text-red-600",
    dismiss: "text-red-400 hover:text-red-700 hover:bg-red-100",
    label: "Critical",
  },
  warning: {
    bar: "bg-amber-50 border-amber-200",
    icon: "text-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    title: "text-amber-900",
    meta: "text-amber-600",
    dismiss: "text-amber-400 hover:text-amber-700 hover:bg-amber-100",
    label: "Warning",
  },
  info: {
    bar: "bg-blue-50 border-blue-200",
    icon: "text-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    title: "text-blue-900",
    meta: "text-blue-600",
    dismiss: "text-blue-400 hover:text-blue-700 hover:bg-blue-100",
    label: "Notice",
  },
};

function AlertIcon({ severity }: { severity: RecurringIssue["severity"] }) {
  if (severity === "critical") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  }
  if (severity === "warning") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function IssueRow({ issue, cfg }: { issue: RecurringIssue; cfg: typeof severityConfig["critical"] }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-dashed last:border-0 border-current/10">
      <span className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", cfg.dot)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold capitalize", cfg.title)}>
          {issue.label}
        </p>
        <p className={cn("text-xs mt-0.5", cfg.meta)}>
          {issue.count} complaint{issue.count !== 1 ? "s" : ""} from{" "}
          {issue.userCount} unique user{issue.userCount !== 1 ? "s" : ""} in the last 60 days
        </p>
      </div>
      <span className={cn("flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border", cfg.badge)}>
        {issue.category}
      </span>
    </div>
  );
}

export function AlertBar({ issues }: AlertBarProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const visible = issues.filter((i) => !dismissed.has(i.label));
  if (visible.length === 0) return null;

  // Group by severity for rendering
  const grouped = {
    critical: visible.filter((i) => i.severity === "critical"),
    warning:  visible.filter((i) => i.severity === "warning"),
    info:     visible.filter((i) => i.severity === "info"),
  };

  const topSeverity = grouped.critical.length > 0
    ? "critical"
    : grouped.warning.length > 0
    ? "warning"
    : "info";

  const cfg = severityConfig[topSeverity];

  return (
    <div className={cn("rounded-2xl border mb-8 overflow-hidden", cfg.bar)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <span className={cn("flex-shrink-0", cfg.icon)}>
          <AlertIcon severity={topSeverity} />
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold", cfg.title)}>
            Recurring Issue Alerts
            <span className={cn("ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border", cfg.badge)}>
              {visible.length} issue{visible.length !== 1 ? "s" : ""}
            </span>
          </p>
          <p className={cn("text-xs mt-0.5", cfg.meta)}>
            Patterns detected from complaints in the last 60 days
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn("p-1.5 rounded-lg transition-colors text-xs font-medium", cfg.dismiss)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={cn("transition-transform", collapsed ? "rotate-180" : "")}
            >
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 pb-4">
          {(["critical", "warning", "info"] as const).map((sev) => {
            const group = grouped[sev];
            if (group.length === 0) return null;
            const c = severityConfig[sev];
            return (
              <div key={sev} className="mb-3 last:mb-0">
                <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", c.meta)}>
                  {c.label}
                </p>
                <div className={cn("rounded-xl border px-4", c.bar, "border-current/20")}>
                  {group.map((issue) => (
                    <div key={issue.label} className="relative group/row">
                      <IssueRow issue={issue} cfg={c} />
                      <button
                        type="button"
                        onClick={() => setDismissed((prev) => new Set([...prev, issue.label]))}
                        className={cn(
                          "absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity",
                          c.dismiss
                        )}
                        title="Dismiss"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
