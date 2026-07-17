import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { restrictTenant, suspendTenant } from "@/lib/tenancy/lifecycle/suspension-service";
import { startOffboarding, archiveTenant } from "@/lib/tenancy/lifecycle/offboarding-service";
import { activateTenant } from "@/lib/tenancy/lifecycle/activation-service";

const listQuerySchema = z.object({
  status: z.string().optional(),
  q: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("platform:tenants:read");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const q = listQuerySchema.parse(Object.fromEntries(url.searchParams));

  const tenants = await prisma.organisation.findMany({
    where: {
      tenantStatus: q.status ? (q.status as never) : undefined,
      name: q.q ? { contains: q.q, mode: "insensitive" } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return jsonOk({
    tenants,
    disclaimer:
      "Tenant status is operational metadata. It is not a certification, entitlement, or GA approval.",
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suspend"),
    organisationId: z.string().min(1),
    reason: z.string().min(20).max(2000),
  }),
  z.object({
    action: z.literal("restrict"),
    organisationId: z.string().min(1),
    reason: z.string().min(10).max(2000),
  }),
  z.object({
    action: z.literal("offboard"),
    organisationId: z.string().min(1),
    reason: z.string().min(30).max(2000),
  }),
  z.object({
    action: z.literal("archive"),
    organisationId: z.string().min(1),
    reason: z.string().min(30).max(2000),
  }),
  z.object({
    action: z.literal("activate"),
    organisationId: z.string().min(1),
    reason: z.string().min(20).max(2000),
    gaAssessmentId: z.string().min(1),
  }),
]);

export async function POST(req: Request) {
  const user = await requireApiPermission("platform:tenants:lifecycle");
  if (user instanceof Response) return user;

  try {
    const input = actionSchema.parse(await req.json());
    switch (input.action) {
      case "suspend": {
        const r = await suspendTenant({
          organisationId: input.organisationId,
          actorUserId: user.id,
          reason: input.reason,
        });
        return jsonOk({ organisation: r });
      }
      case "restrict": {
        const r = await restrictTenant({
          organisationId: input.organisationId,
          actorUserId: user.id,
          reason: input.reason,
        });
        return jsonOk({ organisation: r });
      }
      case "offboard": {
        const r = await startOffboarding({
          organisationId: input.organisationId,
          actorUserId: user.id,
          reason: input.reason,
        });
        return jsonOk({ organisation: r });
      }
      case "archive": {
        const r = await archiveTenant({
          organisationId: input.organisationId,
          actorUserId: user.id,
          reason: input.reason,
        });
        return jsonOk({ organisation: r });
      }
      case "activate": {
        const r = await activateTenant({
          organisationId: input.organisationId,
          actorUserId: user.id,
          reason: input.reason,
          gaAssessmentId: input.gaAssessmentId,
        });
        return jsonOk({ organisation: r });
      }
      default: {
        const _exhaustive: never = input;
        return jsonError("Unknown action", 400);
      }
    }
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError((e as Error).message ?? "Action failed", 400);
  }
}
