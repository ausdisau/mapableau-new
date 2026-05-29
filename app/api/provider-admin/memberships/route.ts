import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { ensureProviderOrganisation } from "@/lib/providers/ensure-provider-organisation";
import { prisma } from "@/lib/prisma";
import { MembershipResponse } from "@/schemas/provider-admin.types";

export async function GET(): Promise<
  NextResponse<MembershipResponse | { error: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.providerUserRole.findMany({
    where: { userId: session.user.id },
    include: {
      provider: { select: { id: true, name: true } },
    },
    orderBy: { provider: { name: "asc" } },
  });

  const enriched = await Promise.all(
    memberships.map(async (m) => ({
      providerId: m.provider.id,
      providerName: m.provider.name,
      role: m.role,
      organisationId: await ensureProviderOrganisation(m.provider.id),
    }))
  );

  return NextResponse.json({ memberships: enriched });
}
