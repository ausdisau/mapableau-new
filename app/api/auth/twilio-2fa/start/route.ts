import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { normalizePhoneForTwilio } from "@/lib/auth/phone-normalize";
import {
  hasTwilioVerifyConfig,
  isTwilio2FAEnabled,
  maskPhoneNumber,
  startTwilioSmsVerification,
} from "@/lib/auth/twilio-verify";
import { createTwoFactorToken } from "@/lib/auth/two-factor-token";
import { prisma } from "@/lib/prisma";

type StartTwoFactorBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: StartTwoFactorBody;
  try {
    body = (await request.json()) as StartTwoFactorBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isTwilio2FAEnabled()) {
    return NextResponse.json({ required: false });
  }

  if (!hasTwilioVerifyConfig()) {
    console.error("[twilio-2fa] enabled without Twilio Verify configuration");
    return NextResponse.json(
      { error: "Two-factor authentication is unavailable" },
      { status: 503 },
    );
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const email = normalizeAuthEmail(body.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      phone: true,
    },
  });

  const password = body.password.trim();
  const validPassword =
    user?.passwordHash && (await compare(password, user.passwordHash));
  if (!user || !validPassword) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const normalizedPhone = user.phone
    ? normalizePhoneForTwilio(user.phone)
    : null;
  if (!normalizedPhone) {
    return NextResponse.json(
      {
        code: "MISSING_PHONE",
        error:
          "Two-factor authentication is enabled, but this account does not have a valid phone number.",
      },
      { status: 400 },
    );
  }

  await startTwilioSmsVerification(normalizedPhone);

  return NextResponse.json({
    required: true,
    challengeToken: createTwoFactorToken({
      purpose: "twilio-2fa-challenge",
      userId: user.id,
    }),
    phoneHint: maskPhoneNumber(normalizedPhone),
  });
}
