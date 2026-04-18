import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizeSupabaseUrl(raw) {
  const trimmed = String(raw).trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");

  let url;
  try {
    url = new URL(withoutTrailingSlash);
  } catch {
    throw new Error(`SUPABASE_URL must be a valid URL (got: ${raw})`);
  }

  if (url.hostname.endsWith(".supabase.com")) {
    throw new Error(
      `SUPABASE_URL looks wrong (${url.hostname}). Use your project's API URL like https://<ref>.supabase.co`
    );
  }

  return url.toString();
}

export function createSupabaseAnonClient() {
  const supabaseUrl = normalizeSupabaseUrl(requireEnv("SUPABASE_URL"));
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createSupabaseAdminClient() {
  const supabaseUrl = normalizeSupabaseUrl(requireEnv("SUPABASE_URL"));
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
