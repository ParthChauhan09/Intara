"use client";

import { createContext, useContext, ReactNode } from "react";
import { StateManager, stateManager } from "./StateManager";
import { useInitApi } from "@/lib/useInitApi";

const MainContext = createContext<StateManager | null>(null);

interface MainContextProviderProps {
  children: ReactNode;
}

export function MainContextProvider({ children }: MainContextProviderProps) {
  useInitApi();

  return (
    <MainContext.Provider value={stateManager}>
      {children}
    </MainContext.Provider>
  );
}

export function useMainContext(): StateManager {
  const context = useContext(MainContext);
  if (!context) {
    throw new Error(
      "useMainContext must be used within a MainContextProvider"
    );
  }
  return context;
}
