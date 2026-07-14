import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import { listProviderLearners } from "@/lib/academy/provider/provider-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("academy:provider:admin");
  if (user instanceof Response) return user;
  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) {
    return NextResponse.json(
      { error: "organisationId is required" },
      { status: 400 },
    );
  }
  try {
    const learners = await listProviderLearners(user, organisationId);
    return NextResponse.json({ learners });
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
