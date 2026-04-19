"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SlaCountdownProps {
  slaDeadline: string | null;
  resolvedAt: string | null;
  className?: string;
}

function getRemainingMs(deadline: string): number {
  return new Date(deadline).getTime() - Date.now();
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "Overdue";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function SlaCountdown({ slaDeadline, resolvedAt, className }: SlaCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(
    slaDeadline ? getRemainingMs(slaDeadline) : null
  );

  useEffect(() => {
    if (!slaDeadline || resolvedAt) return;
    setRemaining(getRemainingMs(slaDeadline));
    const interval = setInterval(() => {
      setRemaining(getRemainingMs(slaDeadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [slaDeadline, resolvedAt]);

  if (!slaDeadline) return null;

  if (resolvedAt) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-emerald-600", className)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Resolved
      </span>
    );
  }

  if (remaining === null) return null;

  const isOverdue = remaining <= 0;
  const isWarning = remaining > 0 && remaining < 2 * 60 * 60 * 1000; // < 2 hours

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums",
      isOverdue ? "text-red-600" : isWarning ? "text-amber-600" : "text-slate-500",
      className
    )}>
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      {isOverdue ? "Overdue" : formatDuration(remaining)}
    </span>
  );
}
