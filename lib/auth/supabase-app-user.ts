import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveAppUserFromSupabase(supabaseUser: SupabaseUser) {
  if (!supabaseUser.email) return null;

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ authSupabaseId: supabaseUser.id }, { email: supabaseUser.email }],
    },
    include: { roleAssignments: true },
  });

  if (user && !user.authSupabaseId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { authSupabaseId: supabaseUser.id },
      include: { roleAssignments: true },
    });
  }

  return user;
}

export async function ensureSupabaseUserForAppUser(input: {
  userId: string;
  email: string;
  password?: string;
}): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { authSupabaseId: true },
  });

  if (existing?.authSupabaseId) {
    return existing.authSupabaseId;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: { mapable_user_id: input.userId },
  });

  if (error) {
    const listed = await admin.auth.admin.listUsers();
    const match = listed.data.users.find(
      (candidate) =>
        candidate.email?.toLowerCase() === input.email.toLowerCase()
    );
    if (!match) {
      throw new Error(error.message);
    }

    await prisma.user.update({
      where: { id: input.userId },
      data: { authSupabaseId: match.id },
    });
    return match.id;
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: { authSupabaseId: data.user.id },
  });

  return data.user.id;
}
