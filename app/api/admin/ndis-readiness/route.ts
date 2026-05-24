import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { getNdisReadinessChecklist } from "@/lib/ndis/ndis-readiness-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const checklist = await getNdisReadinessChecklist();
  return NextResponse.json({ checklist });
}
