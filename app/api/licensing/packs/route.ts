import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  generateLicensedPack,
  type LicensedPackType,
} from "@/lib/licensing/licensed-pack-service";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

const packSchema = z.object({
  organisationId: z.string().cuid(),
  packType: z.enum([
    "national_insights_brief",
    "regional_open_data",
    "government_report",
    "provider_benchmark",
  ]),
  periodLabel: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "admin:billing:read")) {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = packSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid pack request", 400);
  }

  const result = await generateLicensedPack({
    organisationId: parsed.data.organisationId,
    packType: parsed.data.packType as LicensedPackType,
    actorUserId: user.id,
    periodLabel: parsed.data.periodLabel,
  });

  if (!result.ok) {
    return jsonError(result.error, 403);
  }

  return jsonOk(result);
}
