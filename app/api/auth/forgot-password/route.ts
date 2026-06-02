import { NextResponse } from "next/server";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { isNeonAuthEnabled } from "@/lib/auth/auth-provider";
import { getNeonAuth } from "@/lib/auth/neon-auth-server";
import {
  buildPasswordResetUrl,
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset-email";
import { signPasswordResetToken } from "@/lib/auth/password-reset-token";
import { prisma } from "@/lib/prisma";

const GENERIC_MESSAGE =
  "If an account exists for that email, we sent password reset instructions.";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email ? normalizeAuthEmail(body.email) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (isNeonAuthEnabled()) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        process.env.NEXTAUTH_URL?.trim() ||
        "http://localhost:3000";
      const { error } = await getNeonAuth().requestPasswordReset({
        email,
        redirectTo: `${appUrl.replace(/\/$/, "")}/reset-password`,
      });
      if (error) {
        console.error("[forgot-password] neon requestPasswordReset failed", error);
      }
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = signPasswordResetToken({ userId: user.id, email: user.email });
      if (!token) {
        console.error("[forgot-password] NEXTAUTH_SECRET missing — cannot sign reset token");
        return NextResponse.json(
          { error: "Password reset is temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }

      const resetUrl = buildPasswordResetUrl(token);

      if (isPasswordResetEmailConfigured()) {
        try {
          await sendPasswordResetEmail({ to: user.email, resetUrl });
        } catch (emailError) {
          console.error("[forgot-password] email send failed", emailError);
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.info("[forgot-password] reset link (dev only):", resetUrl);
      } else {
        console.error(
          "[forgot-password] SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not configured"
        );
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("[forgot-password] failed", error);
    return NextResponse.json(
      { error: "Could not process password reset request." },
      { status: 500 }
    );
  }
}
