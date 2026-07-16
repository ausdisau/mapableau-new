import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  assertNoDiagnosisDisclosure,
  buildInterviewAccessChecklist,
  filterApprovedFunctionalFields,
} from "@/lib/access-intelligence/employment";

export async function POST(request: Request) {
  if (!accessIntelligenceFlags.employmentOrchestrator) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json().catch(() => ({}));

  try {
    assertNoDiagnosisDisclosure(body.requestedFields ?? []);
    const disclosure = filterApprovedFunctionalFields({
      requestedFields: body.requestedFields ?? [],
      approvedFields: body.approvedFields ?? [],
    });
    const checklist = buildInterviewAccessChecklist({
      interviewFormat: body.interviewFormat ?? "in_person",
      hasAccessibleTransport: Boolean(body.hasAccessibleTransport),
      hasSupportWorker: Boolean(body.hasSupportWorker),
      roomRouteKnown: Boolean(body.roomRouteKnown),
      quietWaitingKnown:
        body.quietWaitingKnown === undefined ? null : Boolean(body.quietWaitingKnown),
      toiletKnown: body.toiletKnown === undefined ? null : Boolean(body.toiletKnown),
    });
    return Response.json({ ok: true, disclosure, checklist, actorUserId: userId });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Employment orchestration failed" },
      { status: 400 },
    );
  }
}
