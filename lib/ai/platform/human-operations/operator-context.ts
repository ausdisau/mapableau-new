/**
 * Resolve Human Operations operator context for API routes.
 * Uses explicit role permissions (no admin universal bypass).
 */

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { UserRole } from "@/types/mapable";

import { buildOperatorContextFromRole } from "./rbac";
import type { HumanOpsOperatorContext } from "./types";

export async function resolveHumanOpsOperatorContext(
  user: CurrentUser,
): Promise<HumanOpsOperatorContext> {
  const orgIds = await getUserOrganisationIds(user.id);
  return buildOperatorContextFromRole({
    operatorId: user.id,
    primaryRole: user.primaryRole as UserRole,
    tenantIds: orgIds,
  });
}
