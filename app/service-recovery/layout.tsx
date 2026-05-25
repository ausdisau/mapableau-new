import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function ServiceRecoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/service-recovery");

  return (
    <AppShell userName={user.name} role={user.primaryRole}>
      {children}
    </AppShell>
  );
}
