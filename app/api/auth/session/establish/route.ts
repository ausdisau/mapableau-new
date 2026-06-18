import { NextResponse } from "next/server";

import { establishSupabaseSessionForEmail } from "@/lib/auth/establish-supabase-session";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor-token";
import { prisma } from "@/lib/prisma";

type EstablishSessionBody = {
  passkeyToken?: string;
  twoFactorToken?: string;
};

export async function POST(request: Request) {
  let body: EstablishSessionBody;
  try {
    body = (await request.json()) as EstablishSessionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tokenValue = body.passkeyToken ?? body.twoFactorToken;
  if (!tokenValue) {
    return NextResponse.json({ error: "Missing session token" }, { status: 400 });
  }

  const purpose = body.passkeyToken ? "credentials-passkey" : "credentials-2fa";
  const token = verifyTwoFactorToken(tokenValue, purpose);
  if (!token) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: token.userId } });
  if (!user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await establishSupabaseSessionForEmail(user.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
