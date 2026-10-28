import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Place } from "./domain";
import { DEMO_PLACES } from "./seed";
import { fetchMapAblePublishedPlaces, isMapAbleReadConfigured } from "./mapable";

type Catalog = {
  places: Place[];
  connection: "offline-demo" | "loading" | "live-readonly" | "unavailable";
  message: string;
  refresh: () => Promise<void>;
};
const Context = createContext<Catalog | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [remote, setRemote] = useState<Place[]>([]);
  const [connection, setConnection] = useState<Catalog["connection"]>("offline-demo");
  const [message, setMessage] = useState("Curated Sydney demonstration places. No live venue visits or check-ins.");

  async function refresh() {
    if (!isMapAbleReadConfigured()) {
      setConnection("offline-demo");
      setMessage("Offline demo: set EXPO_PUBLIC_MAPABLE_API_URL to fetch published MapAble place listings.");
      return;
    }
    setConnection("loading");
    setMessage("Loading published MapAble places. No personal preferences are sent.");
    try {
      const rows = await fetchMapAblePublishedPlaces();
      setRemote(rows);
      setConnection("live-readonly");
      setMessage(rows.length
        ? rows.length + " additional published MapAble directory places loaded. Feature-level access evidence still needs checking."
        : "MapAble returned no published places. Demonstration places remain available.");
    } catch {
      setRemote([]);
      setConnection("unavailable");
      setMessage("MapAble is currently unavailable. You can continue using the offline demonstration places.");
    }
  }

  useEffect(() => { void refresh(); }, []);
  const places = useMemo(() => [...DEMO_PLACES, ...remote], [remote]);
  const value = useMemo(() => ({ places, connection, message, refresh }), [places, connection, message]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCatalog(): Catalog {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("CatalogProvider is missing");
  return ctx;
}
