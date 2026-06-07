import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { normalizePhoneForTwilio } from "@/lib/auth/phone-normalize";
import { isTwilio2FAEnabled } from "@/lib/auth/twilio-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
    };

    const email = body.email ? normalizeAuthEmail(body.email) : "";
    const password = body.password?.trim() ?? "";
    const name = body.name?.trim() || email.split("@")[0] || "MapAble user";
    const phoneRaw = body.phone?.trim() ?? "";
    const normalizedPhone = phoneRaw
      ? normalizePhoneForTwilio(phoneRaw)
      : null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (isTwilio2FAEnabled()) {
      if (!phoneRaw) {
        return NextResponse.json(
          { error: "Mobile number is required for two-factor authentication." },
          { status: 400 },
        );
      }
      if (!normalizedPhone) {
        return NextResponse.json(
          { error: "Enter a valid Australian mobile number (e.g. 0412 345 678)." },
          { status: 400 },
        );
      }
    } else if (phoneRaw && !normalizedPhone) {
      return NextResponse.json(
        { error: "Enter a valid phone number or leave the field blank." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Sign in instead, or use a different email.",
          code: "EMAIL_ALREADY_REGISTERED",
        },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      },
    });

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: { userId: user.id, role: user.primaryRole },
      },
      create: {
        userId: user.id,
        role: user.primaryRole,
        isPrimary: true,
      },
      update: { isPrimary: true },
    });

    if (user.primaryRole === "participant") {
      await prisma.participantProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: name,
        },
        update: { displayName: name },
      });
      const { refreshParticipantOnboarding } = await import(
        "@/lib/onboarding/onboarding-service"
      );
      await refreshParticipantOnboarding(user.id, user.id);
    }

    return NextResponse.json({ id: user.id });
  } catch (error) {
    console.error("[register] failed", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
