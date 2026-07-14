
import React, { createContext, useContext, useMemo, useState } from "react";
import {
  DEFAULT_A11Y_PREFERENCES,
  type AccessibilityPreferences,
} from "@mapable/accessibility";

type Ctx = {
  prefs: AccessibilityPreferences;
  setPrefs: (next: Partial<AccessibilityPreferences>) => void;
};

const A11yContext = createContext<Ctx | null>(null);

export function AccessibilityPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefsState] = useState(DEFAULT_A11Y_PREFERENCES);
  const value = useMemo<Ctx>(
    () => ({
      prefs,
      setPrefs: (next) => setPrefsState((p) => ({ ...p, ...next })),
    }),
    [prefs],
  );
  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11yPreferences(): Ctx {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11yPreferences requires provider");
  return ctx;
}
