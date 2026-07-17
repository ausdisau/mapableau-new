import { DomainPlaceholder } from "@/components/accountability/DomainPlaceholder";

export default function AccountabilityCarePage() {
  return (
    <DomainPlaceholder
      title="Care accountability"
      description="Privacy-safe Care reliability measures from approved publication snapshots."
      explain="Care accountability uses published aggregates only. Participant cancellations are never treated as service failure without context."
    />
  );
}
