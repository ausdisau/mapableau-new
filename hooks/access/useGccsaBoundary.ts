"use client";

import { useEffect, useState } from "react";

import type {
  GccsaBoundaryApiResponse,
  GccsaBoundaryFeatureCollection,
} from "@/lib/access/regions/gccsa";

export type GccsaBoundaryState =
  | "loading"
  | "ready"
  | "partial"
  | "unavailable";

export function useGccsaBoundary() {
  const [boundary, setBoundary] =
    useState<GccsaBoundaryFeatureCollection | null>(null);
  const [state, setState] = useState<GccsaBoundaryState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/access/regions/gccsa", {
          signal: controller.signal,
        });
        if (!response.ok) {
          setState("unavailable");
          return;
        }

        const payload = (await response.json()) as GccsaBoundaryApiResponse;
        setBoundary(payload.boundary);
        setState(payload.status.complete ? "ready" : "partial");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState("unavailable");
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return { boundary, state };
}
