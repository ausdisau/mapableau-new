import { redirect } from "next/navigation";

import { AccountLinkingConfirmation } from "@/components/auth/AccountLinkingConfirmation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { auth0 } from "@/lib/auth/auth0";
import { prisma } from "@/lib/prisma";

export default async function AccountLinkConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const params = await searchParams;
  const session = await auth0.getSession();

  if (!session) {
    redirect("/login?returnTo=/account/link-confirm");
  }

  if (!params.profileId) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: params.profileId },
    select: { id: true, email: true },
  });

  if (!profile) {
    redirect("/login?error=missing_profile");
  }

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-bold">Confirm account linking</h1>
        <div className="mt-4">
          <AccountLinkingConfirmation
            profileId={profile.id}
            email={session.user.email ?? profile.email}
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}
