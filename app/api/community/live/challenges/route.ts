import { getApiUser } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { communityDisabled, communityInputError, communityLiveEnabled, communityNoStore, communityOriginGuard } from "@/lib/community-live/runtime";
import { createChallengeSchema, parseCommunityJson } from "@/lib/community-live/validation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  const isAdmin = Boolean(user && isAdminRole(user.primaryRole));
  const includeDrafts = isAdmin && new URL(request.url).searchParams.get("includeDrafts") === "1";
  const challenges = await prisma.communitySignalChallenge.findMany({
    where: includeDrafts ? {} : { status: "published" },
    select: {
      id: true, title: true, template: true, boundary: true,
      instruction: true, status: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return communityNoStore({ challenges, source: "MapAble Community live records; no fictional seed data" });
}

export async function POST(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  if (!user) return communityNoStore({ error: "Sign in required" }, 401);
  if (!isAdminRole(user.primaryRole)) return communityNoStore({ error: "Community administration required" }, 403);
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  try {
    const input = createChallengeSchema.safeParse(await parseCommunityJson(request));
    if (!input.success) return communityNoStore({ error: "Check the challenge information" }, 400);
    const count = await prisma.communitySignalChallenge.count({
      where: { createdById: user.id, createdAt: { gte: new Date(Date.now() - 3600000) } },
    });
    if (count >= 5) return communityNoStore({ error: "Creation limit reached; retry later" }, 429);
    const challenge = await prisma.$transaction(async (tx) => {
      const record = await tx.communitySignalChallenge.create({
        data: {
          title: input.data.title, template: input.data.template,
          boundary: input.data.boundary, instruction: input.data.instruction,
          // Creating a challenge never publishes it, irrespective of client input.
          status: "draft", createdById: user.id,
        },
      });
      await tx.communitySignalAudit.create({
        data: { action: "challenge_created", entityType: "challenge", entityId: record.id, actorId: user.id },
      });
      return record;
    });
    return communityNoStore({ challenge: { id: challenge.id, status: challenge.status } }, 201);
  } catch (error) {
    if (error instanceof Error && ["CONTENT_TYPE", "BODY_TOO_LARGE", "INVALID_JSON"].includes(error.message)) {
      return communityInputError(error);
    }
    throw error;
  }
}

/** Published challenges require a separate explicit administrator action. */
export async function PATCH(request: Request) {
  if (!communityLiveEnabled()) return communityDisabled();
  const user = await getApiUser();
  if (!user) return communityNoStore({ error: "Sign in required" }, 401);
  if (!isAdminRole(user.primaryRole)) return communityNoStore({ error: "Community administration required" }, 403);
  const originError = communityOriginGuard(request);
  if (originError) return originError;
  try {
    const payload = await parseCommunityJson(request);
    if (typeof payload !== "object" || !payload || Array.isArray(payload)) return communityInputError(new Error("INVALID_JSON"));
    const id = (payload as Record<string, unknown>).id;
    const confirmation = (payload as Record<string, unknown>).confirmPublish;
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id) || confirmation !== true) {
      return communityNoStore({ error: "Select a challenge and explicitly confirm publication" }, 400);
    }
    const record = await prisma.$transaction(async tx => {
      const change = await tx.communitySignalChallenge.updateMany({
        where: { id, status: "draft" },
        data: { status: "published" },
      });
      if (change.count !== 1) return null;
      await tx.communitySignalAudit.create({
        data: { action: "challenge_published", entityType: "challenge", entityId: id, actorId: user.id },
      });
      return tx.communitySignalChallenge.findUnique({ where: { id }, select: { id: true, status: true } });
    });
    if (!record) return communityNoStore({ error: "Draft challenge not found or already published" }, 409);
    return communityNoStore({ challenge: record });
  } catch (error) {
    if (error instanceof Error && ["CONTENT_TYPE", "BODY_TOO_LARGE", "INVALID_JSON"].includes(error.message)) {
      return communityInputError(error);
    }
    throw error;
  }
}
