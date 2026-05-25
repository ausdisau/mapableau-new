import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { ensureUserProfileAfterAuth } from "@/lib/auth/create-or-link-profile";
import { getPostAuthRedirectPath } from "@/lib/auth/role-router";
import { prisma } from "@/lib/prisma";
import type { MapAbleUserRole } from "@prisma/client";

type AuthCompletePageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthCompletePage({
  searchParams,
}: AuthCompletePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { primaryRole: true },
  });

  if (!user) {
    redirect("/login");
  }

  await ensureUserProfileAfterAuth(session.user.id, user.primaryRole);

  redirect(
    getPostAuthRedirectPath({
      primaryRole: user.primaryRole as MapAbleUserRole,
      requestedPath: params.next ?? null,
    }),
  );
}
