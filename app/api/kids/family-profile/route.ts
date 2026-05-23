import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  displayName: z.string().min(1),
  childNickname: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const family = await prisma.familyProfile.create({
    data: {
      parentUserId: user.id,
      displayName: body.displayName,
      children: {
        create: { nickname: body.childNickname, privacyLevel: "private" },
      },
    },
    include: { children: true },
  });
  return jsonOk({ family });
}
