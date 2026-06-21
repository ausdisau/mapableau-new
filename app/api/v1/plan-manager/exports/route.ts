import { createHash } from "crypto";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { recordApiCall } from "@/lib/developer-api/api-usage";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { createPlanManagerExportV1 } from "@/lib/plan-manager/export-service";
import { recordUsageEvent } from "@/lib/usage/usage-ledger";
import { prisma } from "@/lib/prisma";

async function authenticateDeveloperApiKey(req: Request) {
  const key = req.headers.get("x-api-key");
  if (!key) return null;
  const hash = createHash("sha256").update(key).digest("hex");
  const record = await prisma.developerApiKey.findFirst({
    where: { keyHash: hash, revokedAt: null },
    include: { app: true },
  });
  if (!record || record.app.status !== "approved") return null;
  return record;
}

export async function POST(req: Request) {
  if (!y2OrchestrationConfig.planManagerIntegrationEnabled) {
    return jsonError("Plan manager integration disabled", 403);
  }

  const body = await req.json().catch(() => ({}));
  const format = body.format === "csv" ? "csv" : "json";
  const apiKeyRecord = await authenticateDeveloperApiKey(req);

  if (apiKeyRecord) {
    const planManagerId =
      typeof body.planManagerId === "string" ? body.planManagerId : null;
    if (!planManagerId) {
      return jsonError("planManagerId required for API key exports", 400);
    }

    const result = await createPlanManagerExportV1({
      planManagerId,
      format,
      pseudonymiseParticipants: body.pseudonymiseParticipants === true,
    });

    await recordApiCall({
      appId: apiKeyRecord.appId,
      path: "/api/v1/plan-manager/exports",
      method: "POST",
      status: 201,
      organisationId: apiKeyRecord.app.developerOrganisationId,
    });

    return jsonOk(result, 201);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "plan_manager:portal")) {
    return jsonError("Forbidden", 403);
  }

  const legacyKey = req.headers.get("x-api-key");
  if (legacyKey && legacyKey !== process.env.PLAN_MANAGER_API_KEY) {
    return jsonError("Invalid API key", 401);
  }

  const result = await createPlanManagerExportV1({
    planManagerId: user.id,
    format,
    pseudonymiseParticipants: body.pseudonymiseParticipants === true,
  });

  await recordUsageEvent({
    category: "export",
    eventType: "plan_manager.export_v1",
    userId: user.id,
  });

  return jsonOk(result, 201);
}
