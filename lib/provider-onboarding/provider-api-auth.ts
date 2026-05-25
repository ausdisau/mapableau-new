import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import { requireApiSession } from "@/lib/api/auth-handler";

import {
  ensureProviderOrganisation,
  resolveProviderAccess,
} from "./provider-access";

export async function requireProviderOnboardingApi(
  organisationIdParam?: string | null,
): Promise<
  | { user: CurrentUser; organisationId: string }
  | Response
> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let access = await resolveProviderAccess(user, organisationIdParam);

  if (!access) {
    const orgId = await ensureProviderOrganisation(user.id, user.name);
    access = { organisationId: orgId, viewAsAdmin: false };
  }

  if (!access) return apiForbidden("Provider organisation access required");

  return { user, organisationId: access.organisationId };
}
