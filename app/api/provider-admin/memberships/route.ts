import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { listProviderMembershipsForUser } from "@/lib/providers/provider-access";
import { MembershipResponse } from "@/schemas/provider-admin.types";

export async function GET(): Promise<
  NextResponse<MembershipResponse | { error: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await listProviderMembershipsForUser(session.user.id);

  return NextResponse.json({
    memberships: memberships.map((m) => ({
      providerId: m.providerId,
      providerName: m.providerName,
      role: m.role,
      organisationId: m.organisationId,
    })),
  });
}
