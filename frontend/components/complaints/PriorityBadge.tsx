"use client";

import { Badge, BadgeVariant } from "@/components/ui/Badge";

interface PriorityBadgeProps {
  priority: string;
}

const getPriorityVariant = (priority: string): BadgeVariant => {
  switch (priority) {
    case "Urgent":
    case "High":
      return "priority-urgent";
    case "Medium":
      return "priority-medium";
    default:
      return "priority-low";
  }
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge variant={getPriorityVariant(priority)}>
      {priority}
    </Badge>
  );
}
