"use client";

import { ComplaintCard } from "./ComplaintCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import type { Complaint } from "@/lib/state/ComplaintsManager";

interface ComplaintListProps {
  complaints: Complaint[];
  onUpdateStatus?: (id: string, status: string) => void;
}

export function ComplaintList({ complaints, onUpdateStatus }: ComplaintListProps) {
  if (complaints.length === 0) {
    return null;
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
            <ComplaintCard key={complaint.id} complaint={complaint} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
