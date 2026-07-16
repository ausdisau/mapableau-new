import { getTransportCapabilityClaims } from "@/lib/transport/production-claims";
import type { TransportCapabilityId } from "@/types/transport-claims";

type Props = {
  capabilityId: TransportCapabilityId;
  className?: string;
};

const LABELS: Record<string, string> = {
  production_ready: "Available now",
  pilot: "Pilot",
  sandbox: "Sandbox",
  planned: "Coming next",
  partner_required: "Requires partner",
  temporarily_unavailable: "Temporarily unavailable",
};

/** Small status badge backed by the server claim registry (build-time read). */
export function TransportFeatureStatus({ capabilityId, className }: Props) {
  const claim = getTransportCapabilityClaims().find((c) => c.id === capabilityId);
  if (!claim) return null;
  const label = LABELS[claim.state] ?? claim.state;
  return (
    <span
      className={
        className ??
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold"
      }
      title={claim.summary}
    >
      {label}
      {claim.advisoryOnly ? " · Advisory" : ""}
    </span>
  );
}
