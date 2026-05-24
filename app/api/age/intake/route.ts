import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  homeSupportNeeds: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const profile = await prisma.agedCareProfile.upsert({
    where: { participantId: user.id },
    create: {
      participantId: user.id,
      intakeJson: { homeSupportNeeds: body.homeSupportNeeds },
    },
    update: {
      intakeJson: { homeSupportNeeds: body.homeSupportNeeds },
    },
  });
  return jsonOk({ profile });
}
