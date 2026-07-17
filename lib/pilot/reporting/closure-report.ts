export function buildPilotClosureReport(input: {
  pilotId: string;
  name: string;
  lessons: string[];
  finalCommittedCents: number;
  participantsExited: number;
}): Record<string, unknown> {
  return {
    pilotId: input.pilotId,
    name: input.name,
    lessons: input.lessons,
    finalCommittedCents: input.finalCommittedCents,
    participantsExited: input.participantsExited,
    closedAt: new Date().toISOString(),
  };
}
