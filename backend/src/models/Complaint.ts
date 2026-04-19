export const Category = {
  Product: "Product",
  Packaging: "Packaging",
  Trade: "Trade",
  Invalid: "Invalid",
} as const;

export const Priority = {
  High: "High",
  Medium: "Medium",
  Low: "Low",
} as const;

export const Status = {
  OPEN: "OPEN",
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  ESCALATED: "ESCALATED",
  CLOSED: "CLOSED",
} as const;

export type ComplaintCategory = (typeof Category)[keyof typeof Category];

export type ComplaintPriority = (typeof Priority)[keyof typeof Priority];

export type ComplaintStatus = (typeof Status)[keyof typeof Status];

export function isComplaintCategory(value: unknown): value is ComplaintCategory {
  return (Object.values(Category) as string[]).includes(value as string);
}

export function isComplaintPriority(value: unknown): value is ComplaintPriority {
  return (Object.values(Priority) as string[]).includes(value as string);
}

export function isComplaintStatus(value: unknown): value is ComplaintStatus {
  return (Object.values(Status) as string[]).includes(value as string);
}

export type AppComplaint = {
  id: string;
  userId: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  recommendation: string[] | null;
  status: ComplaintStatus;
  slaDeadline: string | null;
  createdAt: string;
};

export function isAppComplaint(value: unknown): value is AppComplaint {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.userId === "string" &&
    typeof record.description === "string" &&
    typeof record.category === "string" &&
    typeof record.priority === "string" &&
    (record.recommendation === null || Array.isArray(record.recommendation)) &&
    isComplaintStatus(record.status) &&
    (record.slaDeadline === null || typeof record.slaDeadline === "string") &&
    typeof record.createdAt === "string"
  );
}
