export class AuthStorage {
  private static readonly ACCESS_TOKEN_KEY = "intara_access_token";

  private static getCookieValue(name: string): string | null {
    if (typeof window === "undefined") return null;

    const all = window.document.cookie ? window.document.cookie.split(";") : [];
    for (const entry of all) {
      const [rawKey, ...rest] = entry.trim().split("=");
      if (!rawKey) continue;
      if (rawKey !== name) continue;
      const rawValue = rest.join("=");
      return rawValue ? decodeURIComponent(rawValue) : "";
    }
    return null;
  }

  private static setCookie(name: string, value: string, maxAgeSeconds: number) {
    if (typeof window === "undefined") return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    window.document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;

    const local = window.localStorage.getItem(AuthStorage.ACCESS_TOKEN_KEY);
    if (local) return local;

    const cookie = AuthStorage.getCookieValue(AuthStorage.ACCESS_TOKEN_KEY);
    if (cookie) {
      window.localStorage.setItem(AuthStorage.ACCESS_TOKEN_KEY, cookie);
      return cookie;
    }

    return null;
  }

  static setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AuthStorage.ACCESS_TOKEN_KEY, token);
    AuthStorage.setCookie(AuthStorage.ACCESS_TOKEN_KEY, token, 60 * 60 * 24 * 30);
  }

  static clearAccessToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(AuthStorage.ACCESS_TOKEN_KEY);
    AuthStorage.setCookie(AuthStorage.ACCESS_TOKEN_KEY, "", 0);
  }
}
