"use client";

import { createContext, useContext, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { StateManager, stateManager } from "./StateManager";
import { useInitApi } from "@/lib/useInitApi";
import { FullPageLoader } from "@/components/FullPageLoader";

const MainContext = createContext<StateManager | null>(null);

interface MainContextProviderProps {
  children: ReactNode;
}

export const MainContextProvider = observer(function MainContextProvider({ children }: MainContextProviderProps) {
  useInitApi();

  // Show global loader until auth is hydrated (initial session check)
  if (!stateManager.auth.isHydrated) {
    return (
      <MainContext.Provider value={stateManager}>
        <FullPageLoader />
      </MainContext.Provider>
    );
  }

  return (
    <MainContext.Provider value={stateManager}>
      {children}
    </MainContext.Provider>
  );
});

export function useMainContext(): StateManager {
  const context = useContext(MainContext);
  if (!context) {
    throw new Error(
      "useMainContext must be used within a MainContextProvider"
    );
  }
  return context;
}
