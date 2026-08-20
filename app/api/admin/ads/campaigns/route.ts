import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const campaigns = await prisma.adCampaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      advertiser: true,
      creatives: { take: 3 },
      targets: true,
    },
  });
  return jsonOk({ campaigns });
}

const createSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1).max(200),
  placementCodes: z.array(z.string()).default([]),
  isHouse: z.boolean().optional(),
  priority: z.number().int().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: parsed.data.advertiserId,
      name: parsed.data.name,
      placementCodes: parsed.data.placementCodes,
      isHouse: parsed.data.isHouse ?? false,
      priority: parsed.data.priority ?? 0,
      status: "DRAFT",
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
      targets:
        parsed.data.region || parsed.data.category
          ? {
              create: {
                region: parsed.data.region,
                category: parsed.data.category,
                geometry: { type: "NATIONAL" },
              },
            }
          : undefined,
    },
  });

  return jsonOk({ campaign }, 201);
}
