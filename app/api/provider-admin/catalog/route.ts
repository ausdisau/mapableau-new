import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { getAdminCatalog } from "@/app/utils/provider-admin";
import { userHasProviderConsoleAccess } from "@/lib/providers/provider-access";
import { GetCatalogResponse } from "@/schemas/provider-admin.types";

/**
 * Languages and specialisations for worker profile editing.
 */
export async function GET(): Promise<
  NextResponse<GetCatalogResponse | { error: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await userHasProviderConsoleAccess(session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const catalog = await getAdminCatalog();

  return NextResponse.json(catalog);
}
