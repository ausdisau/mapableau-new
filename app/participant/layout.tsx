import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/participant");

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
