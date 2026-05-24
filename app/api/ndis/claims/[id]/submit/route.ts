import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { submitClaimMock } from "@/lib/ndis/ndis-claim-queue-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const claim = await submitClaimMock(id, user.id);
    return NextResponse.json({ claim });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SUBMIT_FAILED";
    const status =
      message === "DUPLICATE_SUBMISSION"
        ? 409
        : message === "INVALID_STATUS_FOR_SUBMIT"
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
