export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

export const apiEndPointMap = {
  health: "/health",
  auth: {
    signUp: "/sign-up",
    signIn: "/sign-in",
    me: "/me",
    signOut: "/sign-out"
  },
  complaints: {
    list: "/complaints",
    create: "/complaints",
    createAudio: "/complaints/audio",
    updateStatus: "/complaints/update"
  },
  operator: {
    complaints: "/operator/complaints",
    updateStatus: "/operator/complaints/update"
  }
} as const;

export function getApiUrl(path: string): string {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

