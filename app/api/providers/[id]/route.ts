import { NextResponse } from "next/server";

import {
  getPublicProviderProfile,
  toPublicProviderApiPayload,
} from "@/lib/providers/provider-profile-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const profile = await getPublicProviderProfile(id);

  if (!profile) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json({ provider: toPublicProviderApiPayload(profile) });
}
