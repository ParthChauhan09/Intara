"use client";

import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { CategoryBadge } from "./CategoryBadge";
import type { Complaint } from "@/lib/state/ComplaintsManager";

interface ComplaintCardProps {
  complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {complaint.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={complaint.category} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        ID: {complaint.id}
      </p>
    </div>
  );
}
