import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

/** Returns the signed-in user, or null when the request is anonymous. */
export async function getOptionalApiUser(): Promise<CurrentUser | null> {
  return getCurrentUser();
}
