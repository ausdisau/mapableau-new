"use client";

import { createAuthClient } from "@neondatabase/auth/next";

let client: ReturnType<typeof createAuthClient> | null = null;

export function getNeonAuthClient() {
  if (!client) {
    client = createAuthClient();
  }
  return client;
}
