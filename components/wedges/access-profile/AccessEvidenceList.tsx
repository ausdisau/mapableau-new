import type { ProviderAccessCapability } from "@/types/wedges";

type AccessEvidenceListProps = {
  capability: ProviderAccessCapability;
};

type EvidenceItem = {
  label: string;
  available: boolean;
};

export function AccessEvidenceList({ capability }: AccessEvidenceListProps) {
  const items: EvidenceItem[] = [
    { label: "Access photos", available: capability.photosAvailable },
    { label: "Measurements documented", available: capability.measurementsAvailable },
    { label: "Staff disability awareness training", available: capability.staffDisabilityTraining === true },
    { label: "Public transport nearby", available: capability.publicTransportNearby === true },
    { label: "Hearing loop", available: capability.hearingLoop === true },
  ];

  const available = items.filter((i) => i.available);

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        No access evidence uploaded yet. Contact the provider to confirm critical access needs.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Access evidence available">
      {available.map((item) => (
        <li
          key={item.label}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
