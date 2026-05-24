import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { createRegistrationChallenge } from "@/lib/auth/passkeys/passkey-service";

export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const options = await createRegistrationChallenge(user.id);
    return NextResponse.json(options);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PASSKEY_ERROR" },
      { status: 400 }
    );
  }
}
