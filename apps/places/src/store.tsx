import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

import {
  initialPlacesState, parseSavedState, reducePlacesState,
  type PlacesAction, type PlacesState,
} from "./domain";

const STORAGE_KEY = "@mapable/places-prototype/v1";

type PlacesStore = {
  state: PlacesState;
  dispatch: React.Dispatch<PlacesAction>;
  ready: boolean;
  storageMessage: string;
  resetAll: () => Promise<void>;
};
const Context = createContext<PlacesStore | null>(null);

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducePlacesState, initialPlacesState);
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("Loading local records…");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) return;
        if (saved) {
          let parsed: unknown;
          try { parsed = JSON.parse(saved); } catch { parsed = null; }
          const restored = parseSavedState(parsed);
          if (restored) {
            // Immutable restore without a second store: pure fields were validated.
            dispatch({ type: "reset" });
            for (const place of restored.savedPlaces) {
              // Restore via an explicitly typed, non-networked action.
              dispatch({ type: "toggle-saved", place: {
                id: place.id, name: place.name, suburb: place.suburb,
                category: "Saved", description: "", source: "illustrative",
                sourceLabel: "", stepFree: { status: "unknown", detail: "" },
                accessibleToilet: { status: "unknown", detail: "" }, caution: "",
              }, at: place.savedAt });
            }
            for (const memory of restored.memories) dispatch({ type: "save-memory", memory });
            for (const report of restored.reports) {
              dispatch({ type: "save-report", report });
              if (report.status === "prepared-for-review") dispatch({ type: "prepare-report", id: report.id });
            }
            for (const eventId of restored.interestEventIds) dispatch({ type: "toggle-interest", eventId });
            for (const post of restored.posts) {
              dispatch({ type: "save-post", post });
              if (post.status === "prepared-for-review") dispatch({ type: "prepare-post", id: post.id });
            }
            setStorageMessage("Saved records restored from this device.");
          } else {
            setStorageMessage("Local data could not be restored. An empty prototype is available.");
          }
        } else {
          setStorageMessage("Ready. Data stays on this device unless you explicitly export it.");
        }
      } catch {
        if (active) setStorageMessage("Storage is unavailable. Changes may be lost when you close the app.");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).then(() => {
      if (!cancelled) setStorageMessage("Saved on this device.");
    }).catch(() => {
      if (!cancelled) setStorageMessage("Could not save on this device; keep a copy if needed.");
    });
    return () => { cancelled = true; };
  }, [state, ready]);

  const resetAll = async () => {
    dispatch({ type: "reset" });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setStorageMessage("Your saved places, private notes, reports and posts were cleared from this device.");
    } catch {
      setStorageMessage("Could not clear local storage; try again when storage is available.");
    }
  };

  const value = useMemo(() => ({ state, dispatch, ready, storageMessage, resetAll }),
    [state, ready, storageMessage]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePlacesStore(): PlacesStore {
  const context = useContext(Context);
  if (!context) throw new Error("PlacesProvider is missing");
  return context;
}
