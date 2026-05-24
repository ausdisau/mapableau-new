import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { completeStepUp } from "@/lib/auth/step-up/require-step-up";

const schema = z.object({ method: z.string().default("passkey_placeholder") });

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  const method = parsed.success ? parsed.data.method : "passkey_placeholder";

  const session = await completeStepUp(user.id, method);
  return NextResponse.json({ expiresAt: session.expiresAt });
}
