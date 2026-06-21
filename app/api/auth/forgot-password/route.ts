import { NextResponse } from "next/server";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERIC_MESSAGE =
  "If an account exists for that email, we sent password reset instructions.";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email ? normalizeAuthEmail(body.email) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXTAUTH_URL?.trim() ||
      "http://localhost:3000";

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin.replace(/\/$/, "")}/reset-password`,
    });

    if (error) {
      console.error("[forgot-password] Supabase reset failed", error);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("[forgot-password] failed", error);
    return NextResponse.json(
      { error: "Could not process password reset request." },
      { status: 500 },
    );
  }
}
