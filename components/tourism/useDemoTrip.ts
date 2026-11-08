"use client";

import { useEffect, useState } from "react";

import { makeSydneyDemoTrip } from "@/lib/tourism/planner";
import {
  readTourismTrip,
  resetTourismPrototypeStorage,
  writeTourismTrip,
} from "@/lib/tourism/storage";
import type { TourismTrip } from "@/lib/tourism/types";

export function useDemoTrip() {
  const [trip, setTrip] = useState<TourismTrip>(() => makeSydneyDemoTrip());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTrip(readTourismTrip());
    setLoaded(true);
  }, []);

  const save = (next: TourismTrip) => {
    setTrip(next);
    writeTourismTrip(next);
  };

  const reset = () => {
    save(resetTourismPrototypeStorage());
  };

  return { trip, save, reset, loaded };
}
