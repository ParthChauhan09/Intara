"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMainContext } from "@/lib/state/MainContext";

export function useProtectedRoute(redirectTo: string = "/sign-up") {
  const router = useRouter();
  const { auth } = useMainContext();

  const shouldRedirect = useMemo(() => {
    if (!auth.isHydrated) return false;
    return !auth.isAuthenticated;
  }, [auth.isAuthenticated, auth.isHydrated]);

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace(redirectTo);
  }, [redirectTo, router, shouldRedirect]);

  return {
    isReady: auth.isHydrated,
    isAllowed: auth.isHydrated && auth.isAuthenticated
  };
}
