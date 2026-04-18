export type UserRole = string;

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

