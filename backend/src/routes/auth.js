import { Router } from "express";
import { createSupabaseAdminClient, createSupabaseAnonClient } from "../supabase.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.post("/sign-up", async (req, res) => {
  const { email, password, data } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  try {
    const supabase = createSupabaseAnonClient();
    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      options: data ? { data } : undefined
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ user: result.user, session: result.session });
  } catch (err) {
    const isProd = process.env.NODE_ENV === "production";
    const details = isProd
      ? undefined
      : {
          message: err?.message,
          cause: err?.cause
            ? {
                name: err.cause.name,
                message: err.cause.message,
                code: err.cause.code
              }
            : undefined
        };

    return res.status(502).json({ error: err?.message || "Sign-up failed", details });
  }
});

authRouter.post("/sign-in", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    return res.json({ user: data.user, session: data.session });
  } catch (err) {
    const isProd = process.env.NODE_ENV === "production";
    const details = isProd
      ? undefined
      : {
          message: err?.message,
          cause: err?.cause
            ? {
                name: err.cause.name,
                message: err.cause.message,
                code: err.cause.code
              }
            : undefined
        };

    return res.status(502).json({ error: err?.message || "Sign-in failed", details });
  }
});

// Helper for clients: validate token + return current user
authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Optional: server-side session revocation (requires SUPABASE_SERVICE_ROLE_KEY)
authRouter.post("/sign-out", requireAuth, async (req, res) => {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return res.status(501).json({
      error: "Server-side sign-out requires SUPABASE_SERVICE_ROLE_KEY; otherwise delete the token client-side."
    });
  }

  try {
    const { error } = await admin.auth.admin.signOut(req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ status: "ok" });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Sign-out failed" });
  }
});
