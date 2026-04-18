import type { Request, Response, NextFunction } from "express";
import { createSupabaseAnonClient } from "../supabase.ts";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
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
