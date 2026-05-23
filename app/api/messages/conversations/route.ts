import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  createConversation,
  listConversationsForUser,
} from "@/lib/messages/message-service";
import { prisma } from "@/lib/prisma";

const createThreadSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  bookingId: z.string().optional(),
  organisationId: z.string().optional(),
  participantId: z.string().optional(),
  memberUserIds: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const threadType = searchParams.get("thread_type");
  const bookingId = searchParams.get("booking_id");

  let conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );

  if (threadType) {
    conversations = conversations.filter((c) => c.type === threadType);
  }
  if (bookingId) {
    conversations = conversations.filter((c) => c.bookingId === bookingId);
  }

  return jsonOk({ conversations });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createThreadSchema.parse(await req.json());
    const conversation = await createConversation({
      type: parsed.type,
      title: parsed.title,
      createdById: user.id,
      bookingId: parsed.bookingId,
      organisationId: parsed.organisationId,
      participantId: parsed.participantId,
      memberUserIds: parsed.memberUserIds,
    });
    return jsonOk({ conversation }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "THREAD_MEMBER_NOT_ALLOWED") {
      return jsonError("Cannot add members outside booking relationship", 403);
    }
    if (e instanceof Error && e.message === "THREAD_REQUIRES_RELATIONSHIP") {
      return jsonError(
        "Direct messaging requires a booking or support relationship",
        403
      );
    }
    return jsonError("Create conversation failed", 500);
  }
}
