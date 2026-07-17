import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

import {
  hasPartnerScope,
  type AccessOpsPartnerScope,
} from "./scopes";

export interface AccessOpsPartnerAuthContext {
  clientId: string;
  tenantId: string;
  clientKey: string;
  scopes: AccessOpsPartnerScope[];
  rateLimitRpm: number;
}

export function hashPartnerApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createPartnerApiKey(): {
  key: string;
  hash: string;
  hint: string;
} {
  const key = `mapable_acc_${randomBytes(24).toString("base64url")}`;
  return { key, hash: hashPartnerApiKey(key), hint: key.slice(-6) };
}

function parseAuthorizationHeader(request: Request): string | null {
  const direct = request.headers.get("x-accessops-api-key");
  if (direct) return direct;
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice("bearer ".length).trim();
}

function parseScopes(value: unknown): AccessOpsPartnerScope[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((scope) =>
    typeof scope === "string" ? [scope as AccessOpsPartnerScope] : [],
  );
}

export async function authenticateAccessOpsPartnerRequest(
  request: Request,
): Promise<AccessOpsPartnerAuthContext | Response> {
  const key = parseAuthorizationHeader(request);
  if (!key) {
    return Response.json(
      { error: { code: "PARTNER_UNAUTHENTICATED" } },
      { status: 401 },
    );
  }
  const client = await prisma.accessOpsPartnerClient.findFirst({
    where: { keyHash: hashPartnerApiKey(key), status: "active" },
  });
  if (!client) {
    return Response.json(
      { error: { code: "PARTNER_UNAUTHENTICATED" } },
      { status: 401 },
    );
  }
  return {
    clientId: client.id,
    tenantId: client.tenantId,
    clientKey: client.clientKey,
    scopes: parseScopes(client.scopes),
    rateLimitRpm: client.rateLimitRpm,
  };
}

export async function requireAccessOpsPartnerScopes(
  request: Request,
  requiredScopes: AccessOpsPartnerScope[],
): Promise<AccessOpsPartnerAuthContext | Response> {
  const context = await authenticateAccessOpsPartnerRequest(request);
  if (context instanceof Response) return context;
  const missing = requiredScopes.filter(
    (scope) => !hasPartnerScope(context.scopes, scope),
  );
  if (missing.length > 0) {
    return Response.json(
      { error: { code: "PARTNER_SCOPE_REQUIRED", missing } },
      { status: 403 },
    );
  }
  return context;
}
