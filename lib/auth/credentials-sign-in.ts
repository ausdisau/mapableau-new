import { compare } from "bcryptjs";

import { mintAppSessionForUser } from "@/lib/auth/auth-bridge-session";
import { getAuthSessionStatus } from "@/lib/auth/auth-session-status";
import { ensureSupabaseUserForAppUser } from "@/lib/auth/supabase-app-user";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CredentialsSignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" }
  | { ok: false; reason: "unregistered"; email: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function syncSupabasePassword(
  authSupabaseId: string,
  password: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authSupabaseId, {
    password,
  });
  if (error) {
    throw new Error(error.message);
  }
}

/** Email/password sign-in via Supabase, with Prisma passwordHash fallback for legacy users. */
export async function signInWithCredentials(
  email: string,
  password: string
): Promise<CredentialsSignInResult> {
  const normalizedEmail = normalizeEmail(email);
  const supabase = await createClient();

  const { error: supabaseError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (!supabaseError) {
    const sessionStatus = await getAuthSessionStatus();
    if (sessionStatus.status === "unregistered") {
      return { ok: false, reason: "unregistered", email: sessionStatus.email };
    }
    return { ok: true };
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true, email: true, passwordHash: true, authSupabaseId: true },
  });

  if (!user?.passwordHash) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, reason: "invalid_credentials" };
  }

  await ensureSupabaseUserForAppUser({
    userId: user.id,
    email: user.email,
    password,
  });

  const linked = await prisma.user.findUnique({
    where: { id: user.id },
    select: { authSupabaseId: true },
  });

  if (linked?.authSupabaseId) {
    await syncSupabasePassword(linked.authSupabaseId, password);
  }

  await mintAppSessionForUser({ userId: user.id, returnTo: "/dashboard" });

  const sessionStatus = await getAuthSessionStatus();
  if (sessionStatus.status === "unregistered") {
    return { ok: false, reason: "unregistered", email: sessionStatus.email };
  }

  return { ok: true };
}
