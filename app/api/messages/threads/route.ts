import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { createThreadSchema } from "@/lib/validation/messages";
import {
  createBookingThread,
  createDirectThread,
  createGroupThread,
  createInvoiceThread,
} from "@/lib/messages/thread-service";
import { createGroupChat } from "@/lib/messages/group-chat-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "message:send")) {
    return jsonError("You do not have permission to start conversations.", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = createThreadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please check the conversation details and try again.", 400);
  }

  const data = parsed.data;

  try {
    if (data.threadType === "direct") {
      const otherId = data.participantProfileIds?.[0];
      if (!otherId) return jsonError("Choose someone to message.", 400);
      const other = await prisma.user.findUnique({ where: { id: otherId } });
      const thread = await createDirectThread({
        createdBy: user,
        otherProfileId: otherId,
        otherDisplayName: other?.name ?? "Member",
        title: data.title,
      });
      return jsonOk({ thread }, 201);
    }

    if (data.threadType === "group") {
      const ids = data.participantProfileIds ?? [];
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, primaryRole: true },
      });
      const thread = await createGroupChat({
        createdBy: user,
        title: data.title,
        memberProfileIds: ids,
        memberDisplayNames: Object.fromEntries(users.map((u) => [u.id, u.name])),
        memberRoles: Object.fromEntries(
          users.map((u) => [u.id, u.primaryRole as string])
        ),
      });
      return jsonOk({ thread }, 201);
    }

    if (data.threadType === "booking" && data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
      });
      if (!booking) return jsonError("Booking not found.", 404);
      const thread = await createBookingThread({
        createdBy: user,
        bookingId: data.bookingId,
        title: data.title,
        participantId: booking.participantId,
        providerId: booking.assignedOrganisationId ?? undefined,
        participants: [
          {
            profileId: user.id,
            role: user.primaryRole,
            displayName: user.name,
          },
          {
            profileId: booking.participantId,
            role: "participant",
            displayName: "Participant",
          },
        ],
      });
      return jsonOk({ thread }, 201);
    }

    if (data.threadType === "invoice" && data.invoiceId) {
      const thread = await createInvoiceThread({
        createdBy: user,
        invoiceId: data.invoiceId,
        title: data.title,
        participantId: data.participantId ?? user.id,
        participants: [
          { profileId: user.id, role: user.primaryRole, displayName: user.name },
        ],
      });
      return jsonOk({ thread }, 201);
    }

    const thread = await createGroupThread({
      createdBy: user,
      title: data.title,
      participants: [],
    });
    return jsonOk({ thread }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "FORBIDDEN") {
      return jsonError("You cannot create this conversation.", 403);
    }
    return jsonError("Could not create the conversation. Try again.", 500);
  }
}
