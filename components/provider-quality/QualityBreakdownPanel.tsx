import { QualitySignalBadge } from "./QualitySignalBadge";

export function QualityBreakdownPanel({
  profile,
}: {
  profile: {
    signals: { label: string; explanation: string | null; category: string }[];
  } | null;
}) {
  if (!profile) {
    return <p className="text-muted-foreground">No quality profile yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {profile.signals.map((s) => (
        <li key={s.category} className="rounded-lg border p-3">
          <QualitySignalBadge label={s.label} />
          {s.explanation ? <p className="mt-2 text-sm text-muted-foreground">{s.explanation}</p> : null}
        </li>
      ))}
    </ul>
  );
}
