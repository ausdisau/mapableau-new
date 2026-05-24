import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { verifyRegistrationPlaceholder } from "@/lib/auth/passkeys/passkey-service";

const schema = z.object({
  challenge: z.string(),
  credentialId: z.string(),
  publicKey: z.string(),
  deviceName: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const credential = await verifyRegistrationPlaceholder({
    userId: user.id,
    ...parsed.data,
  });

  return NextResponse.json({ credential });
}
