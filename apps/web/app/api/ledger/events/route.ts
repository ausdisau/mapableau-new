import { NextResponse } from "next/server";

import {
  createLedgerEvent,
  listLedgerEvents,
} from "@/lib/ledger/createLedgerEvent";
import type {
  LedgerActorRole,
  LedgerEventType,
  LedgerSubjectType,
} from "@/lib/ledger/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const participantRef = searchParams.get("participantRef") ?? undefined;
  const events = listLedgerEvents(participantRef);
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: auth + role check; reject payloads containing PII keys
    const type = body.type as LedgerEventType;
    const subjectType = body.subjectType as LedgerSubjectType;
    const subjectRef = typeof body.subjectRef === "string" ? body.subjectRef : "";
    const participantRef =
      typeof body.participantRef === "string" ? body.participantRef : "";
    const payload =
      typeof body.payload === "object" && body.payload !== null
        ? (body.payload as Record<string, unknown>)
        : {};

    if (!type || !subjectRef || !participantRef) {
      return NextResponse.json(
        { error: "type, subjectRef, and participantRef are required." },
        { status: 400 }
      );
    }

    const forbiddenKeys = [
      "name",
      "ndisNumber",
      "address",
      "caseNote",
      "participantName",
    ];
    for (const key of forbiddenKeys) {
      if (key in payload) {
        return NextResponse.json(
          {
            error:
              "Ledger payload must not contain personal information. Use references and hashes only.",
          },
          { status: 400 }
        );
      }
    }

    const actorRole =
      typeof body.actorRole === "string" &&
      [
        "participant",
        "nominee",
        "worker",
        "coordinator",
        "plan_manager",
        "provider_admin",
        "system",
        "copilot",
      ].includes(body.actorRole)
        ? body.actorRole
        : "system";

    const event = createLedgerEvent({
      type,
      subjectType,
      subjectRef,
      participantRef,
      actorRole: actorRole as LedgerActorRole,
      payload,
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json(
      { error: "Could not create ledger event." },
      { status: 500 }
    );
  }
}
