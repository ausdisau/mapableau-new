import { QualitySignalBadge } from "./QualitySignalBadge";

export function ProviderQualitySummary({
  signals,
}: {
  signals: { label: string; explanation?: string | null }[];
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {signals.map((s, i) => (
        <li key={i}>
          <QualitySignalBadge label={s.label} />
        </li>
      ))}
    </ul>
  );
}
