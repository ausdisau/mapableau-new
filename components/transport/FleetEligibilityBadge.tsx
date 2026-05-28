export function FleetEligibilityBadge({
  dispatchReady,
  reasons,
}: {
  dispatchReady: boolean;
  reasons?: string[];
}) {
  if (dispatchReady) {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900 dark:bg-green-900/40 dark:text-green-100">
        Dispatch ready
      </span>
    );
  }
  return (
    <span
      className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
      title={reasons?.join("; ")}
    >
      Not dispatch ready
    </span>
  );
}
