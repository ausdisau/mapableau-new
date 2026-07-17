import { ZodError, z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { addReleaseApproval, createRelease, promoteRelease } from "@/lib/releases/release-service";

const createSchema = z.object({
  action: z.literal("create"),
  releaseKey: z.string().min(2).max(200),
  title: z.string().min(2).max(200),
  summary: z.string().max(2000).optional(),
});

const approveSchema = z.object({
  action: z.literal("approve"),
  releaseId: z.string().min(1),
  kind: z.enum(["engineering", "safety", "privacy", "security", "executive"]),
  note: z.string().max(500).optional(),
});

const promoteSchema = z.object({
  action: z.literal("promote"),
  releaseId: z.string().min(1),
  toRing: z.enum([
    "ring_0_internal",
    "ring_1_canary",
    "ring_2_pilot",
    "ring_3_general_limited",
    "ring_4_general",
  ]),
});

const actionSchema = z.discriminatedUnion("action", [
  createSchema,
  approveSchema,
  promoteSchema,
]);

export async function GET() {
  const user = await requireApiPermission("platform:releases:read");
  if (user instanceof Response) return user;
  const releases = await prisma.productionRelease.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { deployments: true },
  });
  return jsonOk({
    releases,
    disclaimer:
      "A release reaching ring_4_general still does not authorise any specific tenant. Tenant GA is a separate decision.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("platform:releases:manage");
  if (user instanceof Response) return user;
  try {
    const input = actionSchema.parse(await req.json());
    switch (input.action) {
      case "create": {
        const r = await createRelease({
          releaseKey: input.releaseKey,
          title: input.title,
          summary: input.summary,
          requestedById: user.id,
        });
        return jsonOk({ release: r }, 201);
      }
      case "approve": {
        const r = await addReleaseApproval({
          releaseId: input.releaseId,
          approval: {
            kind: input.kind,
            userId: user.id,
            approvedAt: new Date().toISOString(),
            note: input.note,
          },
        });
        if (input.kind === "executive") {
          await prisma.productionRelease.update({
            where: { id: input.releaseId },
            data: {
              executiveApprovedById: user.id,
              executiveApprovedAt: new Date(),
            },
          });
        }
        return jsonOk({ release: r });
      }
      case "promote": {
        const r = await promoteRelease({
          releaseId: input.releaseId,
          toRing: input.toRing,
          actorUserId: user.id,
        });
        return jsonOk({ release: r });
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
