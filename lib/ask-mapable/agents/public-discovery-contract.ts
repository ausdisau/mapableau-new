import { z } from "zod";

/**
 * Public MapAble Companion contracts.
 * This is a separated, no-private-records discovery surface.
 * No funding approvals, worker screening, advertising or actions.
 */

export const publicDiscoveryRequest = z.object({
  query: z.string().trim().min(3).max(240),
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  /** Explicit per-request review of external AI processing; not bundled consent. */
  externalAiApproved: z.literal(true),
});

export type PublicDiscoveryRequest = z.infer<typeof publicDiscoveryRequest>;

export const publicProviderEntry = z.object({
  sourceId: z.string(),
  name: z.string(),
  suburb: z.string().nullable(),
  state: z.string().nullable(),
  postcode: z.string().nullable(),
  sourceLabel: z.literal("Imported NDIS provider outlet directory snapshot"),
  sourceUrl: z.string().url(),
  sourceUpdatedAt: z.string().nullable(),
  registrationStatus: z.literal("not_currently_verified"),
  workerScreeningStatus: z.literal("not_checked"),
  accessFit: z.literal("unknown"),
  availability: z.literal("unknown"),
});

export type PublicProviderEntry = z.infer<typeof publicProviderEntry>;

const OFFICIAL_FINDER =
  "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder";

export function mapPublicDirectoryEntries(
  rows: Array<{
    source_id: string;
    provider_name: string;
    suburb: string | null;
    state: string | null;
    postcode: string | null;
    updated_at?: Date | null;
  }>,
): PublicProviderEntry[] {
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    if (!row.source_id?.trim() || !row.provider_name?.trim() || seen.has(row.source_id)) {
      return [];
    }
    seen.add(row.source_id);
    return [{
      sourceId: row.source_id,
      name: row.provider_name,
      suburb: row.suburb,
      state: row.state,
      postcode: row.postcode,
      sourceLabel: "Imported NDIS provider outlet directory snapshot" as const,
      sourceUrl: OFFICIAL_FINDER,
      sourceUpdatedAt:
        row.updated_at && Number.isFinite(row.updated_at.getTime())
          ? row.updated_at.toISOString()
          : null,
      registrationStatus: "not_currently_verified" as const,
      workerScreeningStatus: "not_checked" as const,
      accessFit: "unknown" as const,
      availability: "unknown" as const,
    }];
  });
}

export const publicCompanionFlags = {
  agentEnabled(env: Record<string, string | undefined> = process.env): boolean {
    return env.MAPABLE_PUBLIC_COMPANION_AGENT_ENABLED === "true";
  },
  directoryEnabled(env: Record<string, string | undefined> = process.env): boolean {
    return env.MAPABLE_PUBLIC_COMPANION_DIRECTORY_ENABLED === "true";
  },
  /** Never treat a model turn limit as a monetary budget. */
  isReadyForApprovedRun(env: Record<string, string | undefined> = process.env): boolean {
    return this.agentEnabled(env) &&
      Boolean(env.OPENAI_API_KEY?.trim()) &&
      Boolean(env.MAPABLE_PUBLIC_COMPANION_MODEL?.trim());
  },
} as const;

/** Pre-flight monetary authorization must be performed by an external server-side ledger. */
export type SpendReservation = {
  decision: "approved";
  reservationId: string;
  maxUsdMicros: number;
  /** The ledger owner can refund or reconcile this reservation after an API call. */
  settle: (usage: { requestSucceeded: boolean }) => Promise<void>;
};

export type PublicEvidence = {
  sourceId: string;
  name: string;
  sourceUrl: string;
  evidenceState: "directory_snapshot" | "unknown";
  notes: string;
};

export type PublicCompanionResult = {
  answer: string;
  evidence: PublicEvidence[];
  unknowns: string[];
  actionsPermitted: false;
  regulatedStatusChecked: false;
};
