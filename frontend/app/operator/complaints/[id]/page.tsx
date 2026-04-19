"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/useProtectedRoute";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/Card";
import { apiJson, ApiError } from "@/lib/apiClient";
import { apiEndPointMap } from "@/lib/apiEndPointMap";
import { StatusBadge, statusVariantMap } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { CategoryBadge } from "@/components/complaints/CategoryBadge";
import { SlaCountdown } from "@/components/complaints/SlaCountdown";
import { variantStyles } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Complaint } from "@/lib/state/ComplaintsManager";

type StatItem = { name: string; value: number };

function StatusDropdown({ status, onChange }: { status: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = ["OPEN", "PENDING", "REVIEWED", "ESCALATED", "CLOSED"];

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer border-none focus:outline-none",
          variantStyles[statusVariantMap[status as keyof typeof statusVariantMap] ?? "default"]
        )}>
        {status}
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-40 rounded-2xl bg-white shadow-xl border border-slate-100 z-30 p-1.5">
          {options.map(opt => (
            <button key={opt} type="button"
              className={cn("block w-full text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer",
                opt === status ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
              onClick={() => { onChange(opt); setOpen(false); }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintDetailPage() {
  const { auth } = useMainContext();
  const { isReady, isAllowed } = useProtectedRoute("/sign-in", "operator");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth.accessToken || !id) return;
    // Fetch all complaints and find the one matching the id
    apiJson<{ complaints: Complaint[]; categoryStats: StatItem[]; priorityStats: StatItem[]; statusStats: StatItem[] }>(
      apiEndPointMap.operator.complaints, { accessToken: auth.accessToken }
    )
      .then((data) => {
        const found = (data.complaints || []).find((c) => c.id === id);
        if (!found) setError("Complaint not found.");
        else setComplaint(found);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setError("Forbidden: Operator access required.");
        else setError(err.message || "Failed to load complaint.");
      })
      .finally(() => setLoading(false));
  }, [auth.accessToken, id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!auth.accessToken || !complaint) return;
    setSaving(true);
    setSaved(false);
    const prev = complaint.status;
    setComplaint((c) => c ? { ...c, status: newStatus as any } : c);

    try {
      await apiJson<{ complaint: Complaint }>(apiEndPointMap.operator.updateStatus, {
        method: "PATCH",
        accessToken: auth.accessToken,
        body: { id: complaint.id, status: newStatus },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setComplaint((c) => c ? { ...c, status: prev as any } : c);
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) return <FullPageLoader label="Checking session..." />;
  if (!isAllowed) return <FullPageLoader label="Redirecting..." />;
  if (loading) return <FullPageLoader label="Loading complaint..." />;

  return (
    <PageContainer maxWidth="4xl" showLogout>
      <div className="w-full pb-16">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/operator")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to complaints
        </button>

        {error && (
          <Card variant="panel" className="bg-red-50 border-red-200">
            <CardContent className="text-red-700 font-medium text-center py-4">{error}</CardContent>
          </Card>
        )}

        {complaint && (
          <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {complaint.category && <CategoryBadge category={complaint.category} />}
                {complaint.priority && <PriorityBadge priority={complaint.priority} />}
              </div>
              <p className="text-xl font-semibold text-slate-950 leading-relaxed">
                {complaint.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-500">
                <span>ID: <span className="font-mono text-slate-700">{complaint.id}</span></span>
                <span>Submitted: <span className="text-slate-700">{new Date(complaint.createdAt).toLocaleString()}</span></span>
                {complaint.slaDeadline && (
                  <span className="flex items-center gap-1.5">
                    SLA:
                    <SlaCountdown
                      slaDeadline={complaint.slaDeadline}
                      resolvedAt={complaint.resolvedAt}
                    />
                  </span>
                )}
              </div>
            </div>

            {/* Status card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-950">Status</h2>
                {saving && <span className="text-xs text-slate-400 animate-pulse">Saving...</span>}
                {saved && <span className="text-xs text-emerald-600 font-medium">Saved ✓</span>}
              </div>
              <StatusDropdown status={complaint.status} onChange={handleUpdateStatus} />
            </div>

            {/* Recommendations card */}
            {complaint.recommendation && Array.isArray(complaint.recommendation) && complaint.recommendation.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950 mb-5">Recommendations</h2>
                <ul className="space-y-4">
                  {complaint.recommendation.map((rec, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 mt-1 h-5 w-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default observer(ComplaintDetailPage);
