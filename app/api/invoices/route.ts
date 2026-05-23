import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const participantId = searchParams.get("participant_id");
  const providerId = searchParams.get("provider_id");
  const issuedFrom = searchParams.get("issued_from");
  const issuedTo = searchParams.get("issued_to");
  const take = Math.min(Number(searchParams.get("take") ?? 50), 100);
  const skip = Number(searchParams.get("skip") ?? 0);

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  const dateFilter =
    issuedFrom || issuedTo
      ? {
          issuedAt: {
            ...(issuedFrom ? { gte: new Date(issuedFrom) } : {}),
            ...(issuedTo ? { lte: new Date(issuedTo) } : {}),
          },
        }
      : {};

  let where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...dateFilter,
  };

  if (isAdminRole(user.primaryRole)) {
    if (participantId) where = { ...where, participantId };
    if (providerId) where = { ...where, organisationId: providerId };
  } else {
    where = {
      ...where,
      OR: [
        { participantId: user.id },
        ...(orgIds.length
          ? [{ organisationId: { in: orgIds } }]
          : []),
      ],
    };
    if (participantId && participantId !== user.id && !orgIds.length) {
      return jsonError("Forbidden", 403);
    }
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        lines: true,
        booking: { select: { id: true, bookingType: true, requestedStart: true } },
        organisation: { select: { id: true, name: true } },
      },
      take,
      skip,
    }),
    prisma.invoice.count({ where: where as never }),
  ]);

  return jsonOk({ invoices, total, take, skip });
}
