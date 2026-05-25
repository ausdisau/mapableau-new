import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { createRecoveryCase } from "@/lib/service-recovery/service-recovery-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const cases = await prisma.serviceRecoveryCase.findMany({
    where: isAdminRole(user.primaryRole)
      ? {}
      : { OR: [{ participantId: user.id }, { createdById: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { backupOptions: true },
  });

  return jsonOk({ cases });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();

  const recoveryCase = await createRecoveryCase({
    trigger: body.trigger ?? "participant_reported_issue",
    summary: body.summary,
    bookingId: body.bookingId,
    participantId: body.participantId ?? user.id,
    organisationId: body.organisationId,
    createdById: user.id,
  });

  return jsonOk({ recoveryCase }, 201);
}
