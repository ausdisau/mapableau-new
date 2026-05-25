import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function ClaimValidationSummary({ warnings }: { warnings: string[] }) {
  return (
    <MapAbleCard
      title="Claim validation warnings"
      description="Plain-language checks only — not legal or funding approval advice."
    >
      {warnings.length === 0 ? (
        <p className="text-sm text-green-700 dark:text-green-300">
          No warnings detected. Review line items before processing payment.
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {warnings.map((w, i) => (
            <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
              {w}
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
