import { NextResponse } from "next/server";
import { z } from "zod";

import { confirmAccountLink } from "@/lib/auth/account-linking-service";
import { rateLimitAuthEndpoint } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  token: z.string().min(32),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimitAuthEndpoint(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await confirmAccountLink(parsed.data.token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: result.userId });
}
