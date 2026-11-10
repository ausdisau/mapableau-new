"use client";

import { useEffect } from "react";

import { initAdidFirebase } from "../lib/firebase";

/**
 * Client-only Analytics bootstrap. No-op when Firebase env is unset.
 * Does not replace Clerk authentication.
 */
export function FirebaseAnalytics() {
  useEffect(() => {
    void initAdidFirebase();
  }, []);
  return null;
}
