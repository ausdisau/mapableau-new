import type { NextRequest } from "next/server";

import type { CurrentUser } from "@/lib/auth/current-user";
import { tenantContextFromRequest } from "@/lib/tenancy/context/request-context";
import {
  buildTenantContext,
  type TenantContext,
} from "@/lib/tenancy/context/tenant-context";

export { tenantContextFromRequest };
export type { CurrentUser, TenantContext };

export interface ReleaseCandidateRequestContext {
  currentUser: CurrentUser;
  tenant: TenantContext;
  requestId?: string;
  sourceModules: {
    auth: "@/lib/auth/current-user";
    tenant: "@/lib/tenancy/context/request-context";
  };
}

export function buildReleaseCandidateRequestContext(input: {
  currentUser: CurrentUser;
  tenant: TenantContext;
  requestId?: string;
}): ReleaseCandidateRequestContext {
  return {
    currentUser: input.currentUser,
    tenant: input.tenant,
    requestId: input.requestId,
    sourceModules: {
      auth: "@/lib/auth/current-user",
      tenant: "@/lib/tenancy/context/request-context",
    },
  };
}

export async function releaseCandidateRequestContextFromRequest(
  currentUser: CurrentUser,
  req: NextRequest | Request,
): Promise<ReleaseCandidateRequestContext> {
  const tenant = await tenantContextFromRequest(currentUser, req);
  return buildReleaseCandidateRequestContext({
    currentUser,
    tenant,
    requestId: tenant.requestId,
  });
}

export function buildSyntheticReleaseCandidateRequestContext(input: {
  currentUser: CurrentUser;
  organisationId: string | null;
  requestId?: string;
}): ReleaseCandidateRequestContext {
  const tenant = buildTenantContext({
    organisationId: input.organisationId,
    actor: {
      kind: "user",
      userId: input.currentUser.id,
      role: input.currentUser.primaryRole,
    },
    requestId: input.requestId,
  });
  return buildReleaseCandidateRequestContext({
    currentUser: input.currentUser,
    tenant,
    requestId: input.requestId,
  });
}
