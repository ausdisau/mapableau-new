import { signIn } from "next-auth/react";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";

export type CredentialTwoFactorStartResult =
  | { kind: "signed-in" }
  | {
      kind: "two-factor-required";
      challengeToken: string;
      phoneHint: string;
    }
  | { kind: "missing-phone"; error: string }
  | { kind: "error"; error: string };

export async function startCredentialTwoFactor({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<CredentialTwoFactorStartResult> {
  const response = await fetch("/api/auth/twilio-2fa/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: normalizeAuthEmail(email),
      password: password.trim(),
    }),
  });

  const data = (await response.json()) as {
    challengeToken?: string;
    error?: string;
    phoneHint?: string;
    required?: boolean;
    code?: string;
  };

  if (!response.ok) {
    if (data.code === "MISSING_PHONE") {
      return {
        kind: "missing-phone",
        error:
          data.error ??
          "Two-factor authentication requires a phone number on your account.",
      };
    }
    return {
      kind: "error",
      error: data.error ?? "Could not start two-factor authentication.",
    };
  }

  if (data.required) {
    if (!data.challengeToken) {
      return {
        kind: "error",
        error: "Could not start two-factor authentication.",
      };
    }
    return {
      kind: "two-factor-required",
      challengeToken: data.challengeToken,
      phoneHint: data.phoneHint ?? "your phone",
    };
  }

  const result = await signIn("credentials", {
    email: normalizeAuthEmail(email),
    password: password.trim(),
    redirect: false,
  });

  if (result?.error) {
    return { kind: "error", error: "Invalid email or password" };
  }

  return { kind: "signed-in" };
}

export async function completeCredentialTwoFactor({
  challengeToken,
  code,
}: {
  challengeToken: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const verifyResponse = await fetch("/api/auth/twilio-2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeToken,
      code: code.trim(),
    }),
  });

  const verifyData = (await verifyResponse.json()) as {
    error?: string;
    twoFactorToken?: string;
  };

  if (!verifyResponse.ok || !verifyData.twoFactorToken) {
    return {
      ok: false,
      error: verifyData.error ?? "Invalid verification code",
    };
  }

  const result = await signIn("credentials", {
    twoFactorToken: verifyData.twoFactorToken,
    redirect: false,
  });

  if (result?.error) {
    return {
      ok: false,
      error: "Could not complete sign-in. Please try again.",
    };
  }

  return { ok: true };
}
