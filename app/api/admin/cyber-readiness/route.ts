import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { getCyberReadinessChecklist } from "@/lib/security/cyber-readiness-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const checklist = await getCyberReadinessChecklist();
  return NextResponse.json({ checklist });
}
