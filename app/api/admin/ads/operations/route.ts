import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const [advertisers, providers, placements] = await Promise.all([
    prisma.adAdvertiser.findMany({ orderBy: { name: "asc" }, take: 100 }),
    prisma.adProviderConfig.findMany(),
    prisma.adPlacement.findMany({ orderBy: { code: "asc" } }),
  ]);

  return jsonOk({
    killSwitch: {
      globalEnv: adsFlagsConfig.isGlobalKillSwitch(),
      flags: {
        enabled: adsFlagsConfig.isEnabled(),
        access: adsFlagsConfig.isAccessEnabled(),
        providerFinder: adsFlagsConfig.isProviderFinderEnabled(),
        internal: adsFlagsConfig.isInternalEnabled(),
        google: adsFlagsConfig.isGoogleEnabled(),
        ethicalads: adsFlagsConfig.isEthicalAdsEnabled(),
      },
    },
    advertisers,
    providers,
    placements,
  });
}

const advertiserSchema = z.object({
  name: z.string().min(1).max(200),
  organisationId: z.string().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "DISABLED"])
    .optional(),
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

  const parsed = advertiserSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const advertiser = await prisma.adAdvertiser.create({
    data: {
      name: parsed.data.name,
      organisationId: parsed.data.organisationId,
      status: parsed.data.status ?? "DRAFT",
    },
  });

  return jsonOk({ advertiser }, 201);
}
