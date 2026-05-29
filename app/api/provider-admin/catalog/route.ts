import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { getAdminCatalog } from "@/app/utils/provider-admin";
import { prisma } from "@/lib/prisma";
import { GetCatalogResponse } from "@/schemas/provider-admin.types";

/**
 * Languages and specialisations for worker profile editing.
 */
export async function GET(): Promise<
  NextResponse<GetCatalogResponse | { error: string }>
> {
  const user = await auth();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasMembership = await prisma.providerUserRole.findFirst({
    where: { userId: user.id },
  });
  if (!hasMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const catalog = await getAdminCatalog();

  return NextResponse.json(catalog);
}
