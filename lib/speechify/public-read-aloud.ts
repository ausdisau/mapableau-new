import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 10 * 60;

export class PublicTtsSigningNotConfiguredError extends Error {
  constructor() {
    super("Public TTS signing is not configured");
    this.name = "PublicTtsSigningNotConfiguredError";
  }
}

function signingSecret(): string {
  const secret = process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET?.trim();
  if (!secret) throw new PublicTtsSigningNotConfiguredError();
  return secret;
}

function signature(text: string, expiresAt: number): Buffer {
  return createHmac("sha256", signingSecret())
    .update(String(expiresAt))
    .update("\n")
    .update(text)
    .digest();
}

export function createPublicSpeechToken(
  text: string,
  nowMs = Date.now(),
): string {
  const expiresAt = Math.floor(nowMs / 1000) + TOKEN_TTL_SECONDS;
  const digest = signature(text, expiresAt).toString("base64url");
  return `${expiresAt}.${digest}`;
}

export function verifyPublicSpeechToken(
  text: string,
  token: string,
  nowMs = Date.now(),
): boolean {
  const [expiresRaw, digestRaw, extra] = token.split(".");
  if (!expiresRaw || !digestRaw || extra) return false;

  const expiresAt = Number(expiresRaw);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (
    !Number.isInteger(expiresAt) ||
    expiresAt < nowSeconds ||
    expiresAt > nowSeconds + TOKEN_TTL_SECONDS + 60
  ) {
    return false;
  }

  let provided: Buffer;
  try {
    provided = Buffer.from(digestRaw, "base64url");
  } catch {
    return false;
  }

  const expected = signature(text, expiresAt);
  return (
    provided.byteLength === expected.byteLength &&
    timingSafeEqual(provided, expected)
  );
}
