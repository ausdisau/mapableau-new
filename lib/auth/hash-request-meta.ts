import { createHash } from "crypto";

import { getAuth0Env } from "@/lib/auth0/env";

export function hashForAudit(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const pepper = getAuth0Env().AUTH_AUDIT_PEPPER;
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}
