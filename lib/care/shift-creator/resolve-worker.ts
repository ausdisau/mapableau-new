import type { OrgWorkerOption, ParsedShiftQuery } from "@/lib/care/shift-creator/types";
import { prisma } from "@/lib/prisma";

export async function listOrgWorkers(
  organisationId: string,
): Promise<OrgWorkerOption[]> {
  const workers = await prisma.workerProfile.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
  return workers;
}

export function resolveWorkerFromParse(
  parsed: ParsedShiftQuery,
  workers: OrgWorkerOption[],
): {
  workerProfileId?: string;
  workerDisplayName?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (parsed.workerProfileId) {
    const worker = workers.find((w) => w.id === parsed.workerProfileId);
    if (worker) {
      return {
        workerProfileId: worker.id,
        workerDisplayName: worker.displayName,
        warnings,
      };
    }
    warnings.push("Worker id in message was not found in your organisation.");
  }

  if (parsed.workerNameHint) {
    const hint = parsed.workerNameHint.toLowerCase();
    const match = workers.find((w) =>
      w.displayName.toLowerCase().includes(hint),
    );
    if (match) {
      return {
        workerProfileId: match.id,
        workerDisplayName: match.displayName,
        warnings,
      };
    }
    warnings.push(`Could not match worker "${parsed.workerNameHint}".`);
  }

  return { warnings };
}
