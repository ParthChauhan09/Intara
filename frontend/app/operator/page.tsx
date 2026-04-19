"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/lib/useProtectedRoute";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { apiJson, ApiError } from "@/lib/apiClient";
import { apiEndPointMap } from "@/lib/apiEndPointMap";
import { StatusBadge } from "@/components/complaints/StatusBadge";
import { PriorityBadge } from "@/components/complaints/PriorityBadge";
import { CategoryBadge } from "@/components/complaints/CategoryBadge";
import { SlaCountdown } from "@/components/complaints/SlaCountdown";
import type { Complaint } from "@/lib/state/ComplaintsManager";

type StatItem = { name: string; value: number };

const CATEGORIES = ["All", "Product", "Packaging", "Trade", "Invalid"];
const PRIORITIES  = ["All", "High", "Medium", "Low"];
const STATUSES    = ["All", "OPEN", "PENDING", "REVIEWED", "ESCALATED", "CLOSED"];

function FilterBar({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 flex-wrap">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === opt ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function OperatorDashboard() {
  const { auth } = useMainContext();
  const { isReady, isAllowed } = useProtectedRoute("/sign-in", "operator");
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (!auth.accessToken) return;
    apiJson<{ complaints: Complaint[]; categoryStats: StatItem[]; priorityStats: StatItem[]; statusStats: StatItem[] }>(
      apiEndPointMap.operator.complaints, { accessToken: auth.accessToken }
    )
      .then((data) => { setComplaints(data.complaints || []); setError(null); })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setError("Forbidden: Operator access required.");
        else setError(err.message || "Failed to load complaints.");
      })
      .finally(() => setLoading(false));
  }, [auth.accessToken]);

  const filtered = useMemo(() => complaints.filter((c) => {
    if (categoryFilter !== "All" && c.category !== categoryFilter) return false;
    if (priorityFilter !== "All" && c.priority !== priorityFilter) return false;
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    return true;
  }), [complaints, categoryFilter, priorityFilter, statusFilter]);

  if (!isAllowed) return <FullPageLoader />;
  if (loading) return <FullPageLoader />;

  return (
    <PageContainer maxWidth="full" showLogout>
      <div className="max-w-[1200px] mx-auto w-full mt-2 sm:mt-6 px-4 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Complaints</h1>
          <p className="mt-3 text-lg text-slate-600">Review and manage all incoming complaints.</p>
        </div>

        {error && (
          <Card variant="panel" className="bg-red-50 border-red-200 mb-8">
            <CardContent className="text-red-700 font-medium text-center mt-0 py-4">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <FilterBar label="Category" options={CATEGORIES} value={categoryFilter} onChange={setCategoryFilter} />
              <FilterBar label="Priority" options={PRIORITIES} value={priorityFilter} onChange={setPriorityFilter} />
              <FilterBar label="Status" options={STATUSES} value={statusFilter} onChange={setStatusFilter} />
              {(categoryFilter !== "All" || priorityFilter !== "All" || statusFilter !== "All") && (
                <button type="button"
                  onClick={() => { setCategoryFilter("All"); setPriorityFilter("All"); setStatusFilter("All"); }}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors self-center">
                  Clear filters
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400 self-center">
                {filtered.length} of {complaints.length} complaints
              </span>
            </div>

            <Card variant="default" className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">All Complaints</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                    <p className="text-sm font-medium text-slate-500">No complaints match your filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing the filters above</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filtered.map((c) => (
                      <div key={c.id}
                        onClick={() => router.push(`/operator/complaints/${c.id}`)}
                        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-950">
                            {c.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {c.category && <CategoryBadge category={c.category} />}
                          {c.priority && <PriorityBadge priority={c.priority} />}
                          <StatusBadge status={c.status} />
                          {c.status !== "CLOSED" && (
                            <SlaCountdown slaDeadline={c.slaDeadline} resolvedAt={c.resolvedAt} />
                          )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default observer(OperatorDashboard);
