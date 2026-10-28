import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";

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
  const writes = useRef<Promise<void>>(Promise.resolve());

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
            dispatch({ type: "hydrate", state: restored });
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
    const snapshot = JSON.stringify(state);
    // Serialise writes. Otherwise a slow earlier write could overwrite newer
    // edits or a reset, losing data after an app restart.
    writes.current = writes.current.catch(() => {}).then(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, snapshot);
    });
    void writes.current.then(() => {
      if (!cancelled) setStorageMessage("Saved on this device.");
    }).catch(() => {
      if (!cancelled) setStorageMessage("Could not save on this device; keep a copy if needed.");
    });
    return () => { cancelled = true; };
  }, [state, ready]);

  const resetAll = async () => {
    dispatch({ type: "reset" });
    try {
      // The reset and all earlier edits share one ordered disk-write queue.
      // A subsequent state effect persists only empty records.
      writes.current = writes.current.catch(() => {}).then(async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);
      });
      await writes.current;
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
