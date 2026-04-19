"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMainContext } from "@/lib/state/MainContext";

export function useProtectedRoute(redirectTo: string = "/sign-up", requireAdmin = false) {
  const router = useRouter();
  const { auth } = useMainContext();

  const shouldRedirect = useMemo(() => {
    if (!auth.isHydrated) return false;
    if (!auth.isAuthenticated) return true;
    if (requireAdmin && !auth.isAdmin) return true;
    return false;
  }, [auth.isAuthenticated, auth.isHydrated, auth.isAdmin, requireAdmin]);

  // Redirect admin users away from non-admin pages to the dashboard
  const shouldRedirectAdmin = useMemo(() => {
    if (!auth.isHydrated || !auth.isAuthenticated) return false;
    return !requireAdmin && auth.isAdmin;
  }, [auth.isHydrated, auth.isAuthenticated, auth.isAdmin, requireAdmin]);

  useEffect(() => {
    if (shouldRedirectAdmin) {
      router.replace("/admin");
      return;
    }
    if (!shouldRedirect) return;
    router.replace(redirectTo);
  }, [redirectTo, router, shouldRedirect, shouldRedirectAdmin]);

  return {
    isReady: auth.isHydrated,
    isAllowed: auth.isHydrated && auth.isAuthenticated && (!requireAdmin || auth.isAdmin) && !shouldRedirectAdmin
  };
}
