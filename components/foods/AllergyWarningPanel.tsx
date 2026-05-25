type AllergyWarningPanelProps = {
  conflicts: string[];
};

export function AllergyWarningPanel({ conflicts }: AllergyWarningPanelProps) {
  if (conflicts.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <p className="font-medium">Possible allergen overlap</p>
      <p className="mt-1 text-sm">
        These items may conflict with your dietary profile:{" "}
        {conflicts.join(", ")}. A safety review has been logged. Confirm with
        your support person before eating.
      </p>
    </div>
  );
}
