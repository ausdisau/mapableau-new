import { NextResponse } from "next/server";

import {
  hasTwilioVerifyConfig,
  isTwilio2FAEnabled,
} from "@/lib/auth/twilio-verify";

export async function GET() {
  const enabled = isTwilio2FAEnabled();
  return NextResponse.json({
    enabled,
    configured: enabled ? hasTwilioVerifyConfig() : false,
  });
}
