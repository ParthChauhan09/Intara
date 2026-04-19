export enum Role {
  CUSTOMER = "customer",
  ADMIN = "admin",
  OPERATOR = "operator"
}

export type UserRole = Role;

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function isAppUser(value: unknown): value is AppUser {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.email === "string" &&
    typeof record.role === "string"
  );
}

