import type { NextRequest } from "next/server";

import type { CurrentUser } from "@/lib/auth/current-user";

import { resolveTenantContext } from "./tenant-resolver";
import type { TenantContext } from "./tenant-context";

/**
 * Build a TenantContext from a Next.js API request. Reads the requested
 * organisation from either `x-organisation-id` header or `organisationId`
 * query parameter. Both are advisory; membership is still required for
 * non-admin actors.
 */
export async function tenantContextFromRequest(
  user: CurrentUser,
  req: NextRequest | Request
): Promise<TenantContext> {
  let requested: string | null = null;
  const anyReq = req as NextRequest;
  if (anyReq?.headers) {
    requested = anyReq.headers.get("x-organisation-id");
  }
  if (!requested) {
    try {
      const url = new URL((req as Request).url);
      requested = url.searchParams.get("organisationId");
    } catch {
      requested = null;
    }
  }

  return resolveTenantContext(user, {
    requestedOrganisationId: requested,
    requestId:
      (anyReq?.headers && anyReq.headers.get("x-request-id")) ?? undefined,
  });
}
