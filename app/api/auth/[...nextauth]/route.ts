import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "NextAuth has been replaced by Supabase Auth",
      docs: "https://supabase.com/docs/guides/auth/server-side/nextjs",
    },
    { status: 410 },
  );
}

export async function POST() {
  return GET();
}
