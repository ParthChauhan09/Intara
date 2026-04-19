import { makeAutoObservable, runInAction } from "mobx";
import { apiJson } from "@/lib/apiClient";
import { apiEndPointMap } from "@/lib/apiEndPointMap";
import { AuthStorage } from "@/lib/authStorage";
import { ApiError } from "@/lib/apiClient";

type AuthSession = {
  access_token?: string;
} | null;

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
    name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type AuthResponse = {
  user: AuthUser | null;
  session: AuthSession;
};

type MeResponse = {
  user: AuthUser | null;
};

export class AuthManager {
  accessToken: string | null = null;
  user: AuthUser | null = null;
  isHydrated = false;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  get isAdmin(): boolean {
    return this.user?.user_metadata?.role === "admin";
  }

  async hydrate(): Promise<void> {
    if (typeof window === "undefined") return;

    const token = AuthStorage.getAccessToken();
    runInAction(() => {
      this.accessToken = token;
      // Don't mark hydrated yet — wait for fetchMe to resolve so
      // role-based route guards have the full user before deciding.
    });

    if (token) {
      await this.fetchMe();
    } else {
      runInAction(() => {
        this.user = null;
      });
    }

    runInAction(() => {
      this.isHydrated = true;
    });
  }

  private setSessionFromAuthResponse(result: AuthResponse) {
    const token = result.session?.access_token || null;
    this.accessToken = token;
    this.user = (result.user as AuthUser) ?? null;
    this.error = null;
    this.isHydrated = true;

    if (typeof window !== "undefined") {
      if (token) AuthStorage.setAccessToken(token);
      else AuthStorage.clearAccessToken();
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await apiJson<AuthResponse>(apiEndPointMap.auth.signIn, {
        method: "POST",
        body: { email, password }
      });

      runInAction(() => {
        this.setSessionFromAuthResponse(result);
      });

      // Keep user data consistent with app init flow.
      if (this.accessToken) {
        await this.fetchMe();
      }
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Sign-in failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await apiJson<AuthResponse>(apiEndPointMap.auth.signUp, {
        method: "POST",
        body: { name, email, password }
      });

      runInAction(() => {
        this.setSessionFromAuthResponse(result);
      });

      // Keep user data consistent with app init flow.
      if (this.accessToken) {
        await this.fetchMe();
      }
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Sign-up failed";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async fetchMe(): Promise<void> {
    if (!this.accessToken) return;

    this.isLoading = true;
    this.error = null;

    try {
      const result = await apiJson<MeResponse>(apiEndPointMap.auth.me, {
        method: "GET",
        accessToken: this.accessToken
      });

      runInAction(() => {
        this.user = result.user ?? null;
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Failed to load user";
        this.user = null;
      });

      if (err instanceof ApiError && err.status === 401) {
        runInAction(() => {
          this.accessToken = null;
        });
        if (typeof window !== "undefined") {
          AuthStorage.clearAccessToken();
        }
      }
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async signOut(): Promise<void> {
    const token = this.accessToken;

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      if (token) {
        await apiJson<{ status: string }>(apiEndPointMap.auth.signOut, {
          method: "POST",
          accessToken: token
        });
      }
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Sign-out failed";
      });
    } finally {
      runInAction(() => {
        this.accessToken = null;
        this.user = null;
        this.isLoading = false;
      });

      if (typeof window !== "undefined") {
        AuthStorage.clearAccessToken();
      }
    }
  }
}
