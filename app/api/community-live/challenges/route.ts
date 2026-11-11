import { requireApiAdmin } from "@/lib/api/auth-handler";
import { communityDisabled, communityInputError, communityLiveEnabled, communityNoStore, communityOriginGuard } from "@/lib/community-live/runtime";
import { createChallengeSchema, parseCommunityJson } from "@/lib/community-live/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!communityLiveEnabled()) return communityDisabled();
  const challenges = await prisma.communitySignalChallenge.findMany({
    where: { status: "published" },
    select: { id: true, title: true, template: true, boundary: true, instruction: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return communityNoStore({ challenges });
}

export async function POST(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  let data;
  try {
    data = createChallengeSchema.parse(await parseCommunityJson(request));
  } catch (error) {
    return communityInputError(error);
  }
  const challenge = await prisma.$transaction(async (tx) => {
    const created = await tx.communitySignalChallenge.create({
      data: { ...data, createdById: user.id, status: "draft" },
      select: { id: true, title: true, status: true },
    });
    await tx.communitySignalAudit.create({
      data: { action: "challenge.created", entityType: "challenge", entityId: created.id, actorId: user.id },
    });
    return created;
  });
  return communityNoStore({ challenge }, 201);
}
