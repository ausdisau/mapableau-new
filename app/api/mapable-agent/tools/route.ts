import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { getToolCatalog } from "@/lib/mapable-agent/tools/registry";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  return NextResponse.json({ tools: getToolCatalog() });
}
