import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  participantId: z.string(),
  providerOrgId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const referrals = await prisma.coordinatorReferral.findMany({
    where: { coordinatorId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ referrals });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const referral = await prisma.coordinatorReferral.create({
    data: {
      coordinatorId: user.id,
      participantId: body.participantId,
      providerOrgId: body.providerOrgId,
      notes: body.notes,
      events: {
        create: { eventType: "referral.created", actorId: user.id },
      },
    },
  });
  return jsonOk({ referral });
}
