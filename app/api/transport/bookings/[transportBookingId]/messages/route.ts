import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listTransportMessages,
  postTransportMessage,
} from "@/lib/transport-osm/messaging-service";
import { transportMessageSchema } from "@/lib/validation/transport-osm";

import { canAccessTransportBooking } from "@/lib/transport-osm/access-control";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  const { transportBookingId } = await params;

  if (!(await canAccessTransportBooking(session, transportBookingId))) {
    return jsonError("Forbidden", 403);
  }

  const messages = await listTransportMessages(transportBookingId);
  return jsonOk({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  const { transportBookingId } = await params;

  if (!(await canAccessTransportBooking(session, transportBookingId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const { body } = transportMessageSchema.parse(await req.json());
    const message = await postTransportMessage({
      transportBookingId,
      senderUserId: session.id,
      body,
    });
    return jsonOk({ message }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Send failed", 500);
  }
}
