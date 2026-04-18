import { StatusBadge, statusVariantMap } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { CategoryBadge } from "./CategoryBadge";
import type { Complaint } from "@/lib/state/ComplaintsManager";
import { useState, useRef, useEffect } from "react";
import { variantStyles } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface ComplaintCardProps {
  complaint: Complaint;
  onUpdateStatus?: (id: string, status: string) => void;
}

function StatusDropdown({ 
  status, 
  onChange, 
  className 
}: { 
  status: string; 
  onChange: (val: string) => void; 
  className: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const options = ["OPEN", "PENDING", "REVIEWED", "ESCALATED", "CLOSED"];

  return (
    <div className="relative inline-block" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(className, "flex items-center gap-1 cursor-pointer pr-1")}
        type="button"
      >
        {status}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-32 rounded-[1rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-20 p-1.5">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              className={cn(
                "block w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer",
                opt === status ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
               {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ComplaintCard({ complaint, onUpdateStatus }: ComplaintCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    if (onUpdateStatus) {
      onUpdateStatus(complaint.id, newStatus);
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p 
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "text-sm font-medium text-slate-900 cursor-pointer transition-all",
              isExpanded ? "" : "truncate"
            )}
            title={isExpanded ? "Click to collapse" : "Click to expand"}
          >
            {complaint.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={complaint.category} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        {onUpdateStatus ? (
          <StatusDropdown 
            status={complaint.status} 
            onChange={handleStatusChange}
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 pr-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 border-none",
              variantStyles[statusVariantMap[complaint.status]]
            )}
          />
        ) : (
          <StatusBadge status={complaint.status} />
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        ID: {complaint.id}
      </p>

      {complaint.recommendation && Array.isArray(complaint.recommendation) && complaint.recommendation.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Recommendations</h4>
          <ul className="list-disc pl-4 space-y-1">
            {complaint.recommendation.map((rec, i) => (
              <li key={i} className="text-sm text-slate-600">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
