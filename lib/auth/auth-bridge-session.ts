import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";
import { ensureSupabaseUserForAppUser } from "@/lib/auth/supabase-app-user";
import { createAdminClient } from "@/lib/supabase/admin";

/** Mint a Supabase JWT session cookie after an external identity bridge succeeds. */
export async function mintAppSessionForUser(input: {
  userId: string;
  returnTo: string;
}): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error("User not found for bridge session");
  }

  await ensureSupabaseUserForAppUser({
    userId: user.id,
    email: user.email,
  });

  const admin = createAdminClient();
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });

  if (linkError || !linkData.properties.hashed_token) {
    throw new Error(linkError?.message ?? "Failed to generate Supabase session");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });

  if (verifyError) {
    throw new Error(verifyError.message);
  }

  return isSafeRedirect(input.returnTo) ? input.returnTo : "/dashboard";
}

export async function clearAppSession(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** @deprecated Use mintAppSessionForUser */
export const mintNextAuthSessionForUser = mintAppSessionForUser;

/** @deprecated Use clearAppSession */
export const clearNextAuthSession = clearAppSession;
