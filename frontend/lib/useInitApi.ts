"use client";

import { useEffect } from "react";
import { stateManager } from "@/lib/state/StateManager";

export function useInitApi(): void {
  useEffect(() => {
    void stateManager.auth.hydrate();
  }, []);
}

