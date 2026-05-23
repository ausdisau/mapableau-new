import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { proposeScheduleForBooking } from "@/lib/scheduling/scheduling-service";

const bodySchema = z.object({
  organisationId: z.string(),
  bookingIds: z.array(z.string()).min(1).max(20),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = bodySchema.parse(await req.json());
  const member = await prisma.organisationMember.findFirst({
    where: { userId: user.id, organisationId: body.organisationId },
  });
  if (!member) return jsonError("Forbidden", 403);

  const proposals = [];
  for (const bookingId of body.bookingIds) {
    const proposal = await proposeScheduleForBooking(
      bookingId,
      body.organisationId,
      user.id
    );
    proposals.push({ bookingId, proposal });
  }

  return jsonOk({ proposals });
}
