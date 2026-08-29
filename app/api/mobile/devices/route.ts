import { NextResponse } from "next/server";

import {
  enrolMobileDevice,
  isMobileApiEnabled,
  listMobileDevicesForUser,
  mobileApiDisabledResponse,
  revokeMobileDevice,
} from "@/lib/mobile";
import { requireMobileAccessToken } from "@/lib/mobile/require-mobile-session";

/**
 * POST /api/mobile/devices — enrol device + optional FCM token (Phase 10).
 * DELETE — revoke device.
 */
export async function POST(req: Request) {
  if (!isMobileApiEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }

  const user = await requireMobileAccessToken(req);
  if (user instanceof Response) return user;

  try {
    const body = (await req.json()) as {
      deviceId?: string;
      platform?: string;
      appVersion?: string;
      pushToken?: string | null;
    };

    if (!body.deviceId || !body.appVersion) {
      return NextResponse.json(
        { error: "deviceId and appVersion are required." },
        { status: 400 },
      );
    }

    const platform = body.platform === "ios" ? "ios" : "android";
    const record = enrolMobileDevice({
      deviceId: body.deviceId,
      userId: user.id,
      platform,
      appVersion: body.appVersion,
      pushToken: body.pushToken ?? null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ device: record }, { status: 201 });
  } catch (error) {
    console.error("mobile device enrol failed:", error);
    return NextResponse.json({ error: "Device enrol failed." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!isMobileApiEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }
  const user = await requireMobileAccessToken(req);
  if (user instanceof Response) return user;
  return NextResponse.json({ devices: listMobileDevicesForUser(user.id) });
}

export async function DELETE(req: Request) {
  if (!isMobileApiEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }
  const user = await requireMobileAccessToken(req);
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required." }, { status: 400 });
  }
  const removed = revokeMobileDevice(user.id, deviceId);
  return NextResponse.json({ revoked: removed });
}
