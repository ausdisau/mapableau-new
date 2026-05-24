import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

const DEFAULT_MODULES = {
  roster: true,
  invoices: true,
  compliance: true,
  service_logs: true,
};

export async function getOrCreateToolkitWorkspace(organisationId: string) {
  if (!remainingSystemsConfig.providerToolkitEnabled) {
    throw new Error("TOOLKIT_DISABLED");
  }

  return prisma.toolkitWorkspace.upsert({
    where: { organisationId },
    create: { organisationId, modulesJson: DEFAULT_MODULES },
    update: {},
  });
}

export async function setToolkitModules(
  organisationId: string,
  modules: Record<string, boolean>
) {
  return prisma.toolkitWorkspace.update({
    where: { organisationId },
    data: { modulesJson: modules },
  });
}
