import { AuthStorage } from "@/lib/authStorage";

export function handleAuthError(error: { status?: number }): void {
  if (error.status === 401) {
    AuthStorage.clearAccessToken();
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  }
}
