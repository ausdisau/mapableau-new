import type { MapAbleUserRole, User } from "@prisma/client";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { ensureOAuthUser } from "@/lib/auth/ensure-oauth-user";
import { prisma } from "@/lib/prisma";

export type SupabaseUserMetadata = {
  name?: string | null;
  inviteToken?: string | null;
  primaryRole?: MapAbleUserRole | null;
};

function metadataFromSupabaseUser(
  authUser: SupabaseAuthUser,
): SupabaseUserMetadata {
  const metadata = {
    ...authUser.user_metadata,
    ...authUser.app_metadata,
  } as SupabaseUserMetadata;

  return metadata;
}

export async function ensurePrismaUserFromSupabase(
  authUser: SupabaseAuthUser,
): Promise<User> {
  const email = authUser.email ? normalizeAuthEmail(authUser.email) : "";
  if (!email) {
    throw new Error("Supabase user is missing an email address");
  }

  const metadata = metadataFromSupabaseUser(authUser);
  const name =
    metadata.name?.trim() ||
    authUser.user_metadata?.full_name?.trim?.() ||
    authUser.user_metadata?.name?.trim?.() ||
    email.split("@")[0]?.replace(/[._]/g, " ") ||
    "MapAble User";

  const bySupabaseId = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
  if (bySupabaseId) {
    if (bySupabaseId.email !== email) {
      const updated = await prisma.user.update({
        where: { id: bySupabaseId.id },
        data: { email, name },
      });
      await syncPrismaIdToSupabaseMetadata(authUser.id, updated.id);
      return updated;
    }
    await syncPrismaIdToSupabaseMetadata(authUser.id, bySupabaseId.id);
    return bySupabaseId;
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    const updated = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        supabaseId: authUser.id,
        name: byEmail.name || name,
      },
    });
    await syncPrismaIdToSupabaseMetadata(authUser.id, updated.id);
    return updated;
  }

  const defaultRole = metadata.primaryRole ?? "participant";
  const created = await ensureOAuthUser({
    email,
    name,
    defaultRole,
  });

  const linked = await prisma.user.update({
    where: { id: created.id },
    data: { supabaseId: authUser.id },
  });
  await syncPrismaIdToSupabaseMetadata(authUser.id, linked.id);
  return linked;
}

async function syncPrismaIdToSupabaseMetadata(
  supabaseUserId: string,
  prismaUserId: string,
): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    await getSupabaseAdmin().auth.admin.updateUserById(supabaseUserId, {
      user_metadata: { prismaUserId },
    });
  } catch (error) {
    console.warn("[auth] could not sync prismaUserId to Supabase metadata", error);
  }
}

export async function getPrismaUserIdForSupabaseUser(
  authUser: SupabaseAuthUser,
): Promise<string | null> {
  const user = await ensurePrismaUserFromSupabase(authUser);
  return user.id;
}
