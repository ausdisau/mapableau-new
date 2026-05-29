import { NextResponse } from "next/server";

import { isEmailRegistered } from "@/lib/auth/auth-session-status";
import { jsonOk } from "@/lib/api/response";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const registered = await isEmailRegistered(email);
  return jsonOk({ registered });
}
