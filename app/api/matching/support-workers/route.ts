import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { rankSupportWorkers } from "@/lib/matching/support-worker-matching";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  careRequestId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  schema.parse(await req.json().catch(() => ({})));

  const workers = await prisma.workerProfile.findMany({
    where: { active: true },
    take: 20,
    include: { organisation: true },
  });

  const blocked = await prisma.participantWorkerPreference.findMany({
    where: { participantId: user.id, preferenceType: "blocked" },
  });
  const preferred = await prisma.participantWorkerPreference.findMany({
    where: { participantId: user.id, preferenceType: "preferred" },
  });
  const blockedIds = new Set(blocked.map((b) => b.workerUserId));
  const preferredIds = new Set(preferred.map((p) => p.workerUserId));

  const ranked = rankSupportWorkers(
    workers
      .filter((w): w is typeof w & { userId: string } => Boolean(w.userId))
      .map((w) => ({
        id: w.id,
        verificationStatus: w.verificationStatus,
        organisationVerification: w.organisation?.verificationStatus,
        isBlocked: blockedIds.has(w.userId),
        isPreferred: preferredIds.has(w.userId),
        available: true,
      }))
  );

  return jsonOk({ candidates: ranked });
}
