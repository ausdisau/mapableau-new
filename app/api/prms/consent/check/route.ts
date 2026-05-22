import { NextResponse } from "next/server";

import type { ConsentScope } from "@/lib/prms/types";
import { MOCK_CONSENT, isMockParticipant } from "@/lib/prms/mockPrmsData";

const SCOPE_MAP: Record<string, ConsentScope> = {
  transport: "transport_sharing",
  profile: "profile_sharing",
  billing: "billing_plan_manager",
  employment: "employment_adjustments",
  medical: "medical_documents",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participantId =
      typeof body.participantId === "string" ? body.participantId : "";
    const purpose =
      typeof body.purpose === "string" ? body.purpose : "profile";

    if (!participantId) {
      return NextResponse.json(
        { allowed: false, status: "blocked", reason: "Not signed in." },
        { status: 401 }
      );
    }

    if (!isMockParticipant(participantId)) {
      return NextResponse.json({
        allowed: false,
        status: "needs_confirmation",
        reason: "Participant record not available in demo mode.",
      });
    }

    const scope = SCOPE_MAP[purpose] ?? "profile_sharing";
    const record = MOCK_CONSENT.records.find((r) => r.scope === scope);

    if (!record || record.status !== "granted") {
      return NextResponse.json({
        allowed: false,
        status: "needs_confirmation",
        scope,
        reason: `Consent for ${scope} is not granted. Participant must approve sharing.`,
      });
    }

    if (MOCK_CONSENT.openConflicts.includes(scope)) {
      return NextResponse.json({
        allowed: false,
        status: "blocked",
        scope,
        reason: "Consent conflict — update consent settings first.",
      });
    }

    return NextResponse.json({
      allowed: true,
      status: "granted",
      scope,
      reason: "Consent granted for this purpose.",
    });
  } catch {
    return NextResponse.json(
      { error: "Consent check failed." },
      { status: 500 }
    );
  }
}
