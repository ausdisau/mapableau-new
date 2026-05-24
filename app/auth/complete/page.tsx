import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { ensureProfileOnboarding } from "@/lib/auth/create-or-link-profile";
import { getPostAuthRedirectPath } from "@/lib/auth/role-router";
import { prisma } from "@/lib/prisma";

type AuthCompletePageProps = {
  searchParams: Promise<{ next?: string }>;
};

/**
 * Post-login handler after NextAuth completes OAuth or credentials sign-in.
 * OAuth token exchange runs at `/api/auth/callback/{provider}` (NextAuth).
 */
export default async function AuthCompletePage({
  searchParams,
}: AuthCompletePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const onboarding = await ensureProfileOnboarding(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { primaryRole: true },
  });

  if (!user) {
    redirect("/login");
  }

  redirect(
    getPostAuthRedirectPath({
      primaryRole: user.primaryRole,
      onboardingStatus: onboarding.status,
      requestedPath: params.next ?? null,
    }),
  );
}
