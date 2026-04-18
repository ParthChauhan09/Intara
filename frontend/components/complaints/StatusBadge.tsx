"use client";

import { Badge } from "@/components/ui/Badge";
import type { ComplaintStatus } from "@/lib/state/ComplaintsManager";

interface StatusBadgeProps {
  status: ComplaintStatus;
}

import { BadgeVariant } from "@/components/ui/Badge";

export const statusVariantMap: Record<ComplaintStatus, BadgeVariant> = {
  OPEN: "status-open",
  PENDING: "status-pending",
  REVIEWED: "status-reviewed",
  ESCALATED: "status-escalated",
  CLOSED: "status-closed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {status}
    </Badge>
  );
}
