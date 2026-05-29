import { NextResponse } from "next/server";

/** No-op sink for agent/debug tooling that posts to this path in production. */
export async function POST() {
  return new NextResponse(null, { status: 204 });
}
