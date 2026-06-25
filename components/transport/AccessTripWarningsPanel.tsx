"use client";

type Warning = {
  title: string;
  description?: string;
};

export function AccessTripWarningsPanel({
  warnings,
  journeyConfidence,
}: {
  warnings: string[];
  journeyConfidence?: number | null;
}) {
  if (warnings.length === 0 && journeyConfidence == null) return null;

  return (
    <section
      aria-labelledby="access-warnings-heading"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
    >
      <h2 id="access-warnings-heading" className="font-semibold">
        Access-aware trip information
      </h2>
      {journeyConfidence != null ? (
        <p className="mt-1 text-sm">
          Destination confidence: {Math.round(journeyConfidence)}%
        </p>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
