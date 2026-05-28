import type { TransportVerificationKind } from "@prisma/client";

export const FLEET_DRIVER_VERIFICATION_KINDS: TransportVerificationKind[] = [
  "licence",
  "screening",
  "training",
];

export const FLEET_VEHICLE_VERIFICATION_KINDS: TransportVerificationKind[] = [
  "registration",
  "insurance",
  "inspection",
];

export type VerificationRecord = {
  kind: TransportVerificationKind;
  status: string;
  expiresAt: Date | null;
};

export function checkVerificationRecords(
  records: VerificationRecord[],
  required: TransportVerificationKind[]
): string[] {
  const reasons: string[] = [];
  const now = new Date();
  for (const kind of required) {
    const rec = records.find((r) => r.kind === kind);
    if (!rec || rec.status !== "verified") {
      reasons.push(`${kind} is not verified`);
      continue;
    }
    if (rec.expiresAt && rec.expiresAt < now) {
      reasons.push(`${kind} has expired`);
    }
  }
  return reasons;
}

export function verificationSummary(
  records: VerificationRecord[],
  required: TransportVerificationKind[]
): {
  ready: boolean;
  issues: string[];
  byKind: Record<
    string,
    { status: string; expiresAt: string | null; issue: string | null }
  >;
} {
  const issues = checkVerificationRecords(records, required);
  const byKind: Record<
    string,
    { status: string; expiresAt: string | null; issue: string | null }
  > = {};
  for (const kind of required) {
    const rec = records.find((r) => r.kind === kind);
    const kindIssues = checkVerificationRecords(
      rec ? [rec] : [],
      [kind]
    );
    byKind[kind] = {
      status: rec?.status ?? "not_provided",
      expiresAt: rec?.expiresAt?.toISOString() ?? null,
      issue: kindIssues[0] ?? null,
    };
  }
  return { ready: issues.length === 0, issues, byKind };
}
