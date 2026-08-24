export const EVAL_LAB_SEED_NAMESPACE = "mapable-nerve-centre-eval-lab-v1";
export const EVAL_LAB_DEFAULT_CLOCK = "2026-08-24T10:00:00.000Z";
export const SYNTHETIC_TENANTS = { harbour: "syn-tenant-harbour", inland: "syn-tenant-inland", remote: "syn-tenant-remote" } as const;
export const SYNTHETIC_PARTICIPANT_PREFIX = "syn-participant-";

export function syntheticParticipantId(personaId: string): string {
  return `${SYNTHETIC_PARTICIPANT_PREFIX}${personaId.replace(/^persona-/, "")}`;
}
export function isSyntheticParticipantId(id: string): boolean {
  return id.startsWith(SYNTHETIC_PARTICIPANT_PREFIX) || id.startsWith("syn-");
}
export function assertSyntheticOnly(ids: string[]): void {
  for (const id of ids) {
    if (!isSyntheticParticipantId(id) && !id.startsWith("syn-")) {
      throw new Error(`NON_SYNTHETIC_ID_REJECTED:${id}`);
    }
  }
}
