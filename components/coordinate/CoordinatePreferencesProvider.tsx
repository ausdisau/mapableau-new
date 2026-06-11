"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { DigitalPreferences } from "@/types/mapable";

type CoordinatePreferencesContextValue = {
  preferences: DigitalPreferences;
  className: string;
};

const CoordinatePreferencesContext =
  createContext<CoordinatePreferencesContextValue>({
    preferences: {},
    className: "",
  });

export function CoordinatePreferencesProvider({
  digitalPreferences,
  children,
}: {
  digitalPreferences?: DigitalPreferences | null;
  children: ReactNode;
}) {
  const preferences = digitalPreferences ?? {};
  const className = useMemo(() => {
    const classes: string[] = ["coordinate-shell"];
    if (preferences.highContrast) classes.push("coordinate-high-contrast");
    if (preferences.simpleLanguageMode) classes.push("coordinate-plain-language");
    if (preferences.largeText) classes.push("coordinate-large-text");
    if (preferences.reducedMotion) classes.push("coordinate-reduced-motion");
    return classes.join(" ");
  }, [preferences]);

  return (
    <CoordinatePreferencesContext.Provider value={{ preferences, className }}>
      <div className={className}>{children}</div>
    </CoordinatePreferencesContext.Provider>
  );
}

export function useCoordinatePreferences() {
  return useContext(CoordinatePreferencesContext);
}
