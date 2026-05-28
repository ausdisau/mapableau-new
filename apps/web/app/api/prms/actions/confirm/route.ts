import { NextResponse } from "next/server";

import { createLedgerEvent } from "@/lib/ledger/createLedgerEvent";
import { confirmDraft, getDraft } from "@/lib/prms/draftStore";
import type { ActorType } from "@/lib/prms/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const draftId = typeof body.draftId === "string" ? body.draftId : "";
    const confirmedBy =
      (typeof body.confirmedBy === "string"
        ? body.confirmedBy
        : "participant") as ActorType;

    // TODO: authenticate; never trust client-supplied role without session check
    if (!draftId) {
      return NextResponse.json(
        { error: "Draft id is required to confirm." },
        { status: 400 }
      );
    }

    const existing = getDraft(draftId);
    if (!existing) {
      return NextResponse.json(
        { error: "Draft not found or already confirmed." },
        { status: 404 }
      );
    }

    const official = confirmDraft(draftId, confirmedBy);
    if (!official) {
      return NextResponse.json(
        { error: "Could not confirm draft." },
        { status: 500 }
      );
    }

    const ledgerEvent = createLedgerEvent({
      type:
        official.type === "SERVICE_EVENT"
          ? "service_event_confirmed"
          : "copilot_action_confirmed",
      subjectType:
        official.type === "SERVICE_EVENT" ? "service_event" : "draft_record",
      subjectRef: official.id,
      participantRef: official.participantId,
      actorRole: confirmedBy === "participant" ? "participant" : "system",
      payload: {
        recordType: official.type,
        confirmedAt: official.confirmedAt,
      },
    });

    return NextResponse.json({
      record: official,
      ledgerEventId: ledgerEvent.id,
      message: "Record confirmed in PRMS.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not confirm record. Please try again." },
      { status: 500 }
    );
  }
}
