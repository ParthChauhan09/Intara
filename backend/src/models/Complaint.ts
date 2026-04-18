export type ComplaintCategory = string;

export type ComplaintPriority = string;

export type ComplaintStatus = "OPEN" | "PENDING" | "REVIEWED" | "ESCALATED" | "CLOSED";

export type AppComplaint = {
  id: string;
  userId: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  recommendation: string | null;
  status: ComplaintStatus;
  slaDeadline: string | null;
  createdAt: string;
};

export function isComplaintStatus(value: unknown): value is ComplaintStatus {
  return (
    value === "OPEN" ||
    value === "PENDING" ||
    value === "REVIEWED" ||
    value === "ESCALATED" ||
    value === "CLOSED"
  );
}

export function isAppComplaint(value: unknown): value is AppComplaint {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.userId === "string" &&
    typeof record.description === "string" &&
    typeof record.category === "string" &&
    typeof record.priority === "string" &&
    (record.recommendation === null || typeof record.recommendation === "string") &&
    isComplaintStatus(record.status) &&
    (record.slaDeadline === null || typeof record.slaDeadline === "string") &&
    typeof record.createdAt === "string"
  );
}

