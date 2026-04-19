"use client";

import { ComplaintCard } from "./ComplaintCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import type { Complaint } from "@/lib/state/ComplaintsManager";

interface ComplaintListProps {
  complaints: Complaint[];
  isAdmin?: boolean;
  onUpdateStatus?: (id: string, status: string) => void;
}

export function ComplaintList({ complaints, isAdmin = false, onUpdateStatus }: ComplaintListProps) {
  if (complaints.length === 0) {
    return (
      <Card variant="default" className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
          <p className="text-sm font-medium text-slate-500">No complaints match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing the filters above</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="default" className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Your Complaints</CardTitle>
        <CardDescription>
          Track the status of your submitted complaints.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} isAdmin={isAdmin} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
