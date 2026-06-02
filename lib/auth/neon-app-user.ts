import type { User } from "@prisma/client";

import { ensureOAuthUser } from "@/lib/auth/ensure-oauth-user";

/** Map a Neon Auth session user to the app `User` row (create participant profile if new). */
export async function ensureAppUserFromNeonSession(input: {
  email: string;
  name?: string | null;
}): Promise<User> {
  return ensureOAuthUser({
    email: input.email,
    name: input.name,
    defaultRole: "participant",
  });
}
