"use client";

import { useEffect, useState, useMemo } from "react";
import { useProtectedRoute } from "@/lib/useProtectedRoute";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { apiJson, ApiError } from "@/lib/apiClient";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import type { Complaint } from "@/lib/state/ComplaintsManager";
import { exportToCsv, exportToPdf } from "@/lib/exportComplaints";
import { AlertBar } from "@/components/admin/AlertBar";
import { detectRecurringIssues } from "@/lib/detectRecurringIssues";

type StatItem = { name: string; value: number };

type DashboardStats = {
  categoryStats: StatItem[];
  priorityStats: StatItem[];
  statusStats: StatItem[];
  complaints: Complaint[];
};

const COLORS = ["#0F172A", "#334155", "#64748B", "#94A3B8", "#CBD5E1"];

const CATEGORIES = ["All", "Product", "Packaging", "Trade", "Invalid"];
const PRIORITIES  = ["All", "High", "Medium", "Low"];

function FilterBar({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === opt
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { auth } = useMainContext();
  const { isAllowed } = useProtectedRoute("/sign-in", "admin");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    if (!auth.accessToken) return;

    apiJson<DashboardStats>("/admin/dashboard-stats", {
      accessToken: auth.accessToken
    })
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Forbidden: You do not have admin permissions to view this dashboard.");
        } else {
          setError(err.message || "Failed to load dashboard stats.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth.accessToken]);

  const filteredComplaints = useMemo(() => {
    if (!stats) return [];
    return stats.complaints.filter((c) => {
      const catMatch = categoryFilter === "All" || c.category === categoryFilter;
      const priMatch = priorityFilter === "All" || c.priority === priorityFilter;
      return catMatch && priMatch;
    });
  }, [stats, categoryFilter, priorityFilter]);

  const recurringIssues = useMemo(
    () => (stats ? detectRecurringIssues(stats.complaints) : []),
    [stats]
  );

  const handleUpdateStatus = (id: string, status: string) => {
    if (!auth.accessToken || !stats) return;

    const oldStats = { ...stats, complaints: [...stats.complaints] };
    
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        complaints: prev.complaints.map((c) =>
          c.id === id ? { ...c, status: status as any } : c
        ),
      };
    });

    apiJson<{ complaint: Complaint }>("/admin/complaints/update", {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: { id, status },
    }).catch((err) => {
      console.error("Failed to update status", err);
      setStats(oldStats);
      if (err instanceof ApiError) setError(err.message || "Failed to update complaint status");
    });
  };

  if (!isAllowed) return <FullPageLoader />;
  if (loading) return <FullPageLoader />;

  const renderPieChart = (data: StatItem[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 50px -30px rgba(15,23,42,0.35)', fontSize: 13 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <PageContainer maxWidth="full" showLogout>
      <div className="max-w-[1400px] mx-auto w-full mb-auto mt-2 sm:mt-6 px-4 pb-16">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Dashboard</h1>
          <p className="mt-4 text-lg text-slate-600">Overview of all complaint analytics and system metrics.</p>
        </div>

        {error && (
          <Card variant="panel" className="bg-red-50 border-red-200 mb-8 pb-4 pt-4">
            <CardContent className="text-red-700 font-medium text-center mt-0">
              {error}
            </CardContent>
          </Card>
        )}

        {stats && !error && (
          <>
            <AlertBar issues={recurringIssues} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle as="h3" className="text-xl">Category</CardTitle>
                </CardHeader>
                <CardContent className="mt-4 px-0">
                  {stats.categoryStats.length > 0 ? renderPieChart(stats.categoryStats) : <p className="text-center text-slate-500 my-10">No data</p>}
                </CardContent>
              </Card>

              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle as="h3" className="text-xl">Priority</CardTitle>
                </CardHeader>
                <CardContent className="mt-4 px-0">
                  {stats.priorityStats.length > 0 ? renderPieChart(stats.priorityStats) : <p className="text-center text-slate-500 my-10">No data</p>}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle as="h3" className="text-xl">Total Request Status</CardTitle>
                </CardHeader>
                <CardContent className="mt-4">
                  {stats.statusStats.length > 0 ? (
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.statusStats}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dx={-10} />
                          <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 20px 50px -30px rgba(15,23,42,0.35)'}} />
                          <Bar dataKey="value" fill="#0F172A" radius={[8, 8, 0, 0]} maxBarSize={60}>
                            {stats.statusStats.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 my-10">No data</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-12">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <FilterBar
                  label="Category"
                  options={CATEGORIES}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
                <FilterBar
                  label="Priority"
                  options={PRIORITIES}
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                />
                {(categoryFilter !== "All" || priorityFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => { setCategoryFilter("All"); setPriorityFilter("All"); }}
                    className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
                <span className="text-xs text-slate-400">
                  {filteredComplaints.length} of {stats.complaints.length} complaints
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportToCsv(filteredComplaints)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportToPdf(filteredComplaints)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export PDF
                  </button>
                </div>
              </div>
              <ComplaintList complaints={filteredComplaints} isAdmin={true} onUpdateStatus={handleUpdateStatus} />
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default observer(AdminDashboard);