import type { NextFunction, Request, Response } from "express";
import { createSupabaseAnonClient } from "../supabase.ts";
import { Role } from "../models/User.ts";

export class Middleware {
  private constructor() {}

  private static getBearerToken(req: Request): string | null {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return null;
    return token;
  }

  static async requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = Middleware.getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });

    try {
      const supabase = createSupabaseAnonClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (error) return res.status(401).json({ error: error.message });
      req.user = data.user;
      req.accessToken = token;
      return next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Auth failure";
      return res.status(500).json({ error: message });
    }
  }

  static async requireAdmin(req: Request, res: Response, next: NextFunction) {
    const token = Middleware.getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });

    try {
      const supabase = createSupabaseAnonClient();
      const { data, error } = await supabase.auth.getUser(token);
      if (error) return res.status(401).json({ error: error.message });
      
      const role = data.user.user_metadata?.role;
      if (role !== Role.ADMIN) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      req.user = data.user;
      req.accessToken = token;
      return next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Auth failure";
      return res.status(500).json({ error: message });
    }
  }
}

