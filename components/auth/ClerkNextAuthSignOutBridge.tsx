"use client";

import { useAuth } from "@clerk/nextjs";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Dual-run: marketing `UserButton` (and any other Clerk UI) only clears Clerk.
 * When a Clerk session ends after having been signed in, also clear NextAuth so
 * the leftover JWT cannot keep authorizing dashboard/admin/API.
 */
export function ClerkNextAuthSignOutBridge() {
  const { isSignedIn } = useAuth();
  const wasSignedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (isSignedIn === undefined) return;

    if (wasSignedIn.current === true && isSignedIn === false) {
      void nextAuthSignOut({ redirect: false });
    }

    wasSignedIn.current = isSignedIn;
  }, [isSignedIn]);

  return null;
}
