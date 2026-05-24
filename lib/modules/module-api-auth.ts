import type { CurrentUser } from "@/lib/auth/current-user";
import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";

import {
  resolveCareAccess,
  resolveEmploymentAccess,
  resolveTransportAccess,
} from "./access";

export async function requireCareApi(opts?: {
  participantId?: string | null;
  organisationId?: string | null;
}): Promise<{ user: CurrentUser; access: NonNullable<Awaited<ReturnType<typeof resolveCareAccess>>> } | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const access = await resolveCareAccess(user, opts);
  if (!access) return apiForbidden("Care access denied");
  return { user, access };
}

export async function requireTransportApi(opts?: {
  participantId?: string | null;
  operatorOrganisationId?: string | null;
}): Promise<
  | { user: CurrentUser; access: NonNullable<Awaited<ReturnType<typeof resolveTransportAccess>>> }
  | Response
> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const access = await resolveTransportAccess(user, opts);
  if (!access) return apiForbidden("Transport access denied");
  return { user, access };
}

export async function requireEmploymentApi(opts?: {
  participantId?: string | null;
  employerOrganisationId?: string | null;
}): Promise<
  | { user: CurrentUser; access: NonNullable<Awaited<ReturnType<typeof resolveEmploymentAccess>>> }
  | Response
> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const access = await resolveEmploymentAccess(user, opts);
  if (!access) return apiForbidden("Employment access denied");
  return { user, access };
}
