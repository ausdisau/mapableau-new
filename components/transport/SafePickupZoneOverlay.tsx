"use client";

export type SafePickupEvidence = {
  label: string;
  kerbGradient?: string;
  checkedAt?: string;
  source?: string;
  vehicleClearance?: string;
};

type Props = {
  zones: SafePickupEvidence[];
};

/**
 * Structured evidence pills for verified kerbside / vehicle fit.
 * Text labels only — never colour-only status.
 */
export function SafePickupZoneOverlay({ zones }: Props) {
  if (zones.length === 0) {
    return (
      <p className="tb-ink-secondary text-sm" role="status">
        No verified safe-pickup evidence is attached to this request yet.
        Dispatchers review kerbside notes after you submit.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {zones.map((zone) => (
        <li key={zone.label} className="tb-surface-muted space-y-1 p-3">
          <p className="font-heading text-sm font-semibold">{zone.label}</p>
          <div className="flex flex-wrap gap-2">
            {zone.kerbGradient ? (
              <span className="tb-evidence-pill">
                <strong>Kerb gradient:</strong> {zone.kerbGradient}
              </span>
            ) : null}
            {zone.checkedAt ? (
              <span className="tb-evidence-pill">
                <strong>Checked:</strong> {zone.checkedAt}
              </span>
            ) : null}
            {zone.source ? (
              <span className="tb-evidence-pill">
                <strong>Source:</strong> {zone.source}
              </span>
            ) : null}
            {zone.vehicleClearance ? (
              <span className="tb-evidence-pill">
                <strong>Vehicle clearance:</strong> {zone.vehicleClearance}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
