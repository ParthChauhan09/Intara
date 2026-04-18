"use client";

import { useEffect, useState } from "react";
import { useProtectedRoute } from "@/lib/useProtectedRoute";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { apiJson, ApiError } from "@/lib/apiClient";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import type { Complaint } from "@/lib/state/ComplaintsManager";

type StatItem = { name: string; value: number };

type DashboardStats = {
  categoryStats: StatItem[];
  priorityStats: StatItem[];
  statusStats: StatItem[];
  complaints: Complaint[];
};

const COLORS = ["#0F172A", "#334155", "#64748B", "#94A3B8", "#CBD5E1"];

function AdminDashboard() {
  const { auth } = useMainContext();
  const { isReady, isAllowed } = useProtectedRoute("/sign-in");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (!isReady) return <FullPageLoader label="Checking session..." />;
  if (!isAllowed) return <FullPageLoader label="Redirecting..." />;

  const renderPieChart = (data: StatItem[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={40}
          paddingAngle={2}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 20px 50px -30px rgba(15,23,42,0.35)'}} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <PageContainer maxWidth="full">
      <div className="max-w-[1400px] mx-auto w-full mb-auto mt-2 sm:mt-6 px-4 pb-16">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Dashboard</h1>
          <p className="mt-4 text-lg text-slate-600">Overview of all complaint analytics and system metrics.</p>
        </div>

        {loading && <div className="text-center text-slate-500 my-20 text-lg animate-pulse">Loading stats...</div>}
        
        {error && (
          <Card variant="panel" className="bg-red-50 border-red-200 mb-8 pb-4 pt-4">
            <CardContent className="text-red-700 font-medium text-center mt-0">
              {error}
            </CardContent>
          </Card>
        )}

        {stats && !error && (
          <>
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
                            {stats.statusStats.map((entry, index) => (
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
              <ComplaintList complaints={stats.complaints} onUpdateStatus={handleUpdateStatus} />
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default observer(AdminDashboard);
