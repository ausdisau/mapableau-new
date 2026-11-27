import "server-only";

import {
  getReadWindow,
  isWithinWeek,
  needsAttention,
  formatStatus,
  sydneyDateKey,
  type CareSchedulerData,
  type CareSchedulerEntry,
  type CareSchedulerRole,
} from "@/lib/care/scheduler/ui-model";
import { prisma } from "@/lib/prisma";

const MAX_SHIFTS = 200;
type ShiftProjection = {
  id: string;
  participantId: string;
  workerProfileId: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  careRequest: { title: string } | null;
  workerProfile: { displayName: string } | null;
  participant?: { name: string | null } | null;
};

/** Uses the canonical CareShift record; no synthetic or copied bookings. */
function toEntry(row: ShiftProjection, role: CareSchedulerRole): CareSchedulerEntry {
  const date = sydneyDateKey(row.startAt);
  const href =
    role === "participant"
      ? "/care/shifts/" + encodeURIComponent(row.id)
      : role === "worker"
        ? "/worker/shifts/" + encodeURIComponent(row.id)
        : "/provider/care/shifts/" + encodeURIComponent(row.id);
  return {
    id: row.id,
    date,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    // Do not place support task descriptions, diagnoses or home addresses in a matrix.
    service: role === "participant" ? row.careRequest?.title ?? "Care support" : "Care support",
    workerId: row.workerProfileId,
    workerLabel: row.workerProfile?.displayName ?? "Worker not allocated",
    participantLabel:
      role === "provider" ? row.participant?.name ?? "Participant" : "Your support",
    status: row.status,
    statusLabel: formatStatus(row.status),
    attention: needsAttention(row.status, row.workerProfileId),
    href,
  };
}

function project(
  rows: ShiftProjection[],
  monday: string,
  role: CareSchedulerRole,
  workers: CareSchedulerData["workers"] = [],
): CareSchedulerData {
  return {
    entries: rows
      .filter((shift) => isWithinWeek(sydneyDateKey(shift.startAt), monday))
      .map((shift) => toEntry(shift, role)),
    workers,
    truncated: rows.length > MAX_SHIFTS,
  };
}

const BASE_SELECT = {
  id: true,
  participantId: true,
  workerProfileId: true,
  startAt: true,
  endAt: true,
  status: true,
  careRequest: { select: { title: true } },
  workerProfile: { select: { displayName: true } },
} as const;

export async function loadParticipantCareWeek(
  participantId: string,
  monday: string,
): Promise<CareSchedulerData> {
  const { from, to } = getReadWindow(monday);
  const rows = await prisma.careShift.findMany({
    where: { participantId, startAt: { gte: from, lt: to } },
    select: BASE_SELECT,
    orderBy: { startAt: "asc" },
    take: MAX_SHIFTS + 1,
  });
  return project(rows, monday, "participant");
}

/**
 * organisationId MUST be chosen from the authenticated caller's membership list
 * in the server page. This function never accepts caller-supplied unscoped IDs.
 */
export async function loadProviderCareWeek(
  organisationId: string,
  monday: string,
): Promise<CareSchedulerData> {
  const { from, to } = getReadWindow(monday);
  const [rows, workers] = await Promise.all([
    prisma.careShift.findMany({
      where: { organisationId, startAt: { gte: from, lt: to } },
      select: {
        ...BASE_SELECT,
        participant: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
      take: MAX_SHIFTS + 1,
    }),
    prisma.workerProfile.findMany({
      where: { organisationId, active: true },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 60,
    }),
  ]);
  return project(
    rows,
    monday,
    "provider",
    workers.map((worker) => ({ id: worker.id, label: worker.displayName })),
  );
}

export async function loadWorkerCareWeek(
  userId: string,
  monday: string,
): Promise<CareSchedulerData> {
  const profiles = await prisma.workerProfile.findMany({
    where: { userId, active: true },
    select: { id: true },
  });
  if (!profiles.length) return { entries: [], workers: [], truncated: false };

  const { from, to } = getReadWindow(monday);
  const rows = await prisma.careShift.findMany({
    where: {
      workerProfileId: { in: profiles.map((profile) => profile.id) },
      startAt: { gte: from, lt: to },
    },
    select: BASE_SELECT,
    orderBy: { startAt: "asc" },
    take: MAX_SHIFTS + 1,
  });
  return project(rows, monday, "worker");
}
