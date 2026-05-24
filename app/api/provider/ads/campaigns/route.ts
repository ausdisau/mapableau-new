import { ZodError } from "zod";

import {
  createProviderCampaign,
  listProviderCampaigns,
} from "@/lib/ads/campaign-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createAdCampaignSchema } from "@/types/ads";

async function getProviderOrgIds(userId: string) {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    include: { organisation: { select: { id: true, name: true, contactEmail: true } } },
  });
  return memberships;
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const memberships = await getProviderOrgIds(user.id);
  const orgIds = memberships.map((m) => m.organisationId);
  const campaigns = await listProviderCampaigns(orgIds);

  return jsonOk({ campaigns });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = createAdCampaignSchema.parse(body);
    const organisationId = body.organisationId as string | undefined;
    if (!organisationId) return jsonError("organisationId is required", 400);

    const memberships = await getProviderOrgIds(user.id);
    const membership = memberships.find((m) => m.organisationId === organisationId);
    if (!membership) return jsonError("Not a member of this organisation", 403);

    const campaign = await createProviderCampaign({
      organisationId,
      createdById: user.id,
      displayName: membership.organisation.name,
      contactEmail: membership.organisation.contactEmail ?? undefined,
      input: parsed,
      submitForReview: body.submitForReview === true,
    });

    return jsonOk({ campaign }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message.startsWith("PROHIBITED_TARGETING")) {
      return jsonError("Targeting uses prohibited sensitive fields", 400);
    }
    return jsonError("Could not create campaign", 500);
  }
}
