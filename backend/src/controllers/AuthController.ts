import type { Request, Response } from "express";
import { createSupabaseAdminClient, createSupabaseAnonClient } from "../supabase.ts";
import type { AuthBody, ErrorWithCause } from "../types/types.ts";

export class AuthController {
  private constructor() {}

  private static getErrorDetails(err: unknown) {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) return undefined;

    const error = err as ErrorWithCause;
    return {
      message: error?.message,
      cause: error?.cause
        ? {
            name: error.cause.name,
            message: error.cause.message,
            code: error.cause.code
          }
        : undefined
    };
  }

  private static getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
  }

  static async signUp(req: Request<{}, {}, AuthBody>, res: Response) {
    const { email, password, name, role, data } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    if (!name) return res.status(400).json({ error: "name is required" });

    try {
      const supabase = createSupabaseAnonClient();
      const userMeta: Record<string, unknown> = {
        ...(data || {}),
        name,
        ...(role ? { role } : {})
      };
      const { data: result, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userMeta }
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ user: result.user, session: result.session });
    } catch (err: unknown) {
      return res.status(502).json({
        error: AuthController.getErrorMessage(err, "Sign-up failed"),
        details: AuthController.getErrorDetails(err)
      });
    }
  }

  static async signIn(req: Request<{}, {}, AuthBody>, res: Response) {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    try {
      const supabase = createSupabaseAnonClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });
      return res.json({ user: data.user, session: data.session });
    } catch (err: unknown) {
      return res.status(502).json({
        error: AuthController.getErrorMessage(err, "Sign-in failed"),
        details: AuthController.getErrorDetails(err)
      });
    }
  }

  static async me(req: Request, res: Response) {
    return res.json({ user: req.user });
  }

  static async signOut(req: Request, res: Response) {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      return res.status(501).json({
        error: "Server-side sign-out requires SUPABASE_SERVICE_ROLE_KEY; otherwise delete the token client-side."
      });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Missing authenticated user" });
    }

    try {
      const { error } = await admin.auth.admin.signOut(req.user.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ status: "ok" });
    } catch (err: unknown) {
      return res.status(500).json({ error: AuthController.getErrorMessage(err, "Sign-out failed") });
    }
  }
}
