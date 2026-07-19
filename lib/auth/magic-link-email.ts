import { getAppBaseUrl } from "@/lib/auth/app-base-url";
import { sendEmail } from "@/lib/sendGrid";

export function isMagicLinkEmailConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
      process.env.SENDGRID_FROM_EMAIL?.trim(),
  );
}

export function buildMagicLinkUrl(token: string, callbackUrl?: string): string {
  const url = new URL("/login/magic", getAppBaseUrl());
  url.searchParams.set("token", token);
  if (callbackUrl) {
    url.searchParams.set("callbackUrl", callbackUrl);
  }
  return url.toString();
}

export async function sendMagicLinkEmail(params: {
  to: string;
  magicUrl: string;
}): Promise<void> {
  const subject = "Your MapAble sign-in link";
  const text = [
    "Use this link to sign in to MapAble. It expires in 15 minutes.",
    "",
    params.magicUrl,
    "",
    "If you did not request this, you can ignore this email.",
    "You do not need to memorise a code or solve a puzzle.",
  ].join("\n");

  const html = `
    <p>Use this link to sign in to MapAble. It expires in 15 minutes.</p>
    <p><a href="${params.magicUrl}">Sign in to MapAble</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    <p>You do not need to memorise a code or solve a puzzle.</p>
  `.trim();

  await sendEmail({
    to: params.to,
    subject,
    text,
    html,
  });
}
