import { NextResponse } from "next/server";

import { signInWithCredentials } from "@/lib/auth/credentials-sign-in";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";
  const password =
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email.trim() || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const result = await signInWithCredentials(email, password);

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if (result.reason === "unregistered") {
    return NextResponse.json({
      ok: false,
      unregistered: true,
      email: result.email,
    });
  }

  return NextResponse.json(
    { ok: false, error: "Invalid email or password" },
    { status: 401 }
  );
}
