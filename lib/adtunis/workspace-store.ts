import { prisma } from "@/lib/prisma";
import {
  seedWorkspace,
  workspaceSchema,
  type AdtunisWorkspace,
} from "@mapable/adtunis-core";


/** In-process fallback when the Prisma model is unavailable in a test env. */
const memory = new Map<string, AdtunisWorkspace>();

export async function loadWorkspace(
  participantId: string,
): Promise<AdtunisWorkspace> {
  try {
    const row = await prisma.adtunisParticipantWorkspace.findUnique({
      where: { participantId },
    });
    if (row?.state) {
      return workspaceSchema.parse(row.state);
    }
  } catch {
    const cached = memory.get(participantId);
    if (cached) return workspaceSchema.parse(cached);
  }
  return seedWorkspace();
}

export async function saveWorkspace(
  participantId: string,
  state: AdtunisWorkspace,
): Promise<AdtunisWorkspace> {
  const next = workspaceSchema.parse(state);
  memory.set(participantId, next);
  try {
    await prisma.adtunisParticipantWorkspace.upsert({
      where: { participantId },
      create: { participantId, state: next },
      update: { state: next },
    });
  } catch {
    // Prisma model may be missing before migrate; memory still isolates participants in-process.
  }
  return next;
}
