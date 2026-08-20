import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { flagCreativeClaims } from "@/lib/ads/moderation/creative-review";
import { validateAdDestination } from "@/lib/ads/destination/validate-url";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const creatives = await prisma.adCreative.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { campaign: true },
  });
  return jsonOk({ creatives });
}

const createSchema = z.object({
  campaignId: z.string().min(1),
  format: z.string().min(1).max(64),
  headline: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  destinationUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  altText: z.string().max(500).optional(),
  businessName: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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

  const dest = validateAdDestination(parsed.data.destinationUrl, {
    requireHttps: false,
  });
  if (!dest.ok) {
    return jsonError(`Invalid destination: ${dest.reason}`, 400);
  }

  const claimFlags = flagCreativeClaims(
    `${parsed.data.headline} ${parsed.data.body}`,
  );

  const creative = await prisma.adCreative.create({
    data: {
      ...parsed.data,
      status: "PENDING_REVIEW",
      claimFlags,
    },
  });

  await prisma.adPolicyReview.create({
    data: {
      creativeId: creative.id,
      status: "PENDING_REVIEW",
      claimFlags,
      notes: claimFlags.length
        ? "Auto-flagged claims require human review"
        : null,
    },
  });

  return jsonOk({ creative }, 201);
}
