import { NextResponse } from "next/server";

import {
  isWixMemberBridgeEnabled,
  sanitizeWixSyncPayload,
  syncWixMemberForProfile,
} from "@/lib/wix/wix-member-bridge";

export async function POST(request: Request) {
  if (!isWixMemberBridgeEnabled()) {
    return NextResponse.json(
      {
        enabled: false,
        message: "Wix member bridge is disabled. Set ENABLE_WIX_MEMBER_BRIDGE=true to enable.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const safePayload = sanitizeWixSyncPayload(body);

  const result = await syncWixMemberForProfile({
    profileId: String(body.profileId ?? ""),
    auth0UserId: String(body.auth0UserId ?? ""),
    email: String(safePayload.email ?? ""),
  });

  return NextResponse.json({ enabled: true, safePayload, result });
}
