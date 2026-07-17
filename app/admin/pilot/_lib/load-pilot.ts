import { notFound } from "next/navigation";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function loadAdminPilotPage(pilotId: string) {
  const user = await requirePermission("pilot:view");
  const pilot = await prisma.controlledPilot.findUnique({
    where: { id: pilotId },
  });
  if (!pilot) notFound();

  if (!isAdminRole(user.primaryRole)) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (!orgIds.includes(pilot.organisationId)) notFound();
  }

  return { user, pilot };
}
