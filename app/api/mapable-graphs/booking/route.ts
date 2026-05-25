import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { bookingGraphActionSchema } from "@/lib/mapable-graphs/schemas";
import {
  addCareBookingDraft,
  addEmploymentEvent,
  addTransportBookingDraft,
  createBookingGraphForSession,
  linkBookingDependency,
  markBookingConfirmed,
  markBookingFailed,
  recordTimingIssue,
  validateBookingDependencies,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = bookingGraphActionSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    switch (body.action) {
      case "create_session": {
        const graph = await createBookingGraphForSession(
          body.participantId,
          body.sessionId
        );
        return jsonOk({ graph }, 201);
      }
      case "add_care_draft": {
        const node = await addCareBookingDraft(
          body.participantId,
          body.data?.label as string ?? "Care booking",
          {
            scheduledStart: body.scheduledAt,
            scheduledEnd: body.data?.scheduledEnd,
            ...body.data,
          }
        );
        return jsonOk({ node }, 201);
      }
      case "add_transport_draft": {
        const node = await addTransportBookingDraft(
          body.participantId,
          body.data?.label as string ?? "Transport booking",
          {
            scheduledStart: body.scheduledAt,
            ...body.data,
          }
        );
        return jsonOk({ node }, 201);
      }
      case "add_employment_event": {
        const node = await addEmploymentEvent(
          body.participantId,
          body.data?.label as string ?? "Work start",
          {
            scheduledStart: body.scheduledAt,
            ...body.data,
          }
        );
        return jsonOk({ node }, 201);
      }
      case "link_dependency": {
        if (!body.fromNodeId || !body.toNodeId) {
          return jsonError("fromNodeId and toNodeId required", 400);
        }
        const edge = await linkBookingDependency(
          body.participantId,
          body.fromNodeId,
          body.toNodeId
        );
        return jsonOk({ edge }, 201);
      }
      case "validate": {
        const result = await validateBookingDependencies(body.participantId);
        return jsonOk(result);
      }
      case "confirm": {
        if (!body.fromNodeId) return jsonError("fromNodeId required", 400);
        const node = await markBookingConfirmed(
          body.participantId,
          body.fromNodeId,
          access.id
        );
        return jsonOk({ node });
      }
      case "fail": {
        if (!body.fromNodeId) return jsonError("fromNodeId required", 400);
        const node = await markBookingFailed(
          body.participantId,
          body.fromNodeId,
          String(body.data?.reason ?? "failed")
        );
        return jsonOk({ node });
      }
      case "timing_issue": {
        if (!body.fromNodeId) return jsonError("fromNodeId required", 400);
        await recordTimingIssue(
          body.participantId,
          body.fromNodeId,
          String(body.data?.issue ?? "timing issue")
        );
        return jsonOk({ recorded: true });
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Booking graph action failed", 500);
  }
}
