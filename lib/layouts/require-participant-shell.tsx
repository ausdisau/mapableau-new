import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/current-user";

/** Shared AppShell wrapper for participant-facing routes. */
export async function requireParticipantShell(children: React.ReactNode) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (
    user.primaryRole !== "participant" &&
    user.primaryRole !== "family_member"
  ) {
    redirect("/dashboard");
  }

  return (
    <AppShell userName={user.name} role={user.primaryRole}>
      {children}
    </AppShell>
  );
}
