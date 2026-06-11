import { notFound, redirect } from "next/navigation";

import { CoordinatePreferencesProvider } from "@/components/coordinate/CoordinatePreferencesProvider";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { CoordinateNav } from "@/components/layout/CoordinateNav";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { coordinateConfig } from "@/lib/config/coordinate";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

import "./coordinate.css";

export const dynamic = "force-dynamic";

function canAccessCoordinate(role: UserRole): boolean {
  return (
    hasPermission(role, "coordinate:portal") ||
    hasPermission(role, "coordinate:participant") ||
    hasPermission(role, "coordinate:review") ||
    hasPermission(role, "coordinate:audit:read")
  );
}

export default async function CoordinateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!coordinateConfig.enabled) {
    notFound();
  }

  const user = await requireAuth();
  const role = user.primaryRole as UserRole;

  if (!canAccessCoordinate(role)) {
    redirect("/dashboard");
  }

  const accessibility = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
    select: { digitalPreferences: true },
  });

  const digitalPreferences =
    (accessibility?.digitalPreferences as Record<string, boolean> | null) ??
    null;

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle="MapAble Coordinate"
      logoHref="/coordinate"
      secondaryNav={<CoordinateNav role={role} />}
    >
      <CoordinatePreferencesProvider digitalPreferences={digitalPreferences}>
        {children}
      </CoordinatePreferencesProvider>
    </AuthenticatedRoleAppShell>
  );
}
