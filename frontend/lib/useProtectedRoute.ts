"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMainContext } from "@/lib/state/MainContext";

type RouteRole = "any" | "admin" | "operator";

export function useProtectedRoute(redirectTo: string = "/sign-up", requireRole: RouteRole = "any") {
  const router = useRouter();
  const { auth } = useMainContext();

  const shouldRedirect = useMemo(() => {
    if (!auth.isHydrated) return false;
    if (!auth.isAuthenticated) return true;
    if (requireRole === "admin" && !auth.isAdmin) return true;
    if (requireRole === "operator" && !auth.isOperator && !auth.isAdmin) return true;
    return false;
  }, [auth.isAuthenticated, auth.isHydrated, auth.isAdmin, auth.isOperator, requireRole]);

  // Redirect privileged users away from customer pages
  const privilegedRedirect = useMemo(() => {
    if (!auth.isHydrated || !auth.isAuthenticated) return null;
    if (requireRole !== "any") return null;
    if (auth.isAdmin) return "/admin";
    if (auth.isOperator) return "/operator";
    return null;
  }, [auth.isHydrated, auth.isAuthenticated, auth.isAdmin, auth.isOperator, requireRole]);

  useEffect(() => {
    if (privilegedRedirect) {
      router.replace(privilegedRedirect);
      return;
    }
    if (!shouldRedirect) return;
    router.replace(redirectTo);
  }, [redirectTo, router, shouldRedirect, privilegedRedirect]);

  return {
    isReady: auth.isHydrated,
    isAllowed: auth.isHydrated && auth.isAuthenticated && !privilegedRedirect &&
      (requireRole === "any" || (requireRole === "admin" && auth.isAdmin) || (requireRole === "operator" && (auth.isOperator || auth.isAdmin)))
  };
}
