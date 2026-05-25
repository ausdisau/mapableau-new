export function SyncStatusBadge({
  online,
  pendingCount,
}: {
  online: boolean;
  pendingCount: number;
}) {
  if (online && pendingCount === 0) return null;

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold ${
        online
          ? "bg-secondary/20 text-secondary"
          : "bg-amber-100 text-amber-900"
      }`}
      role="status"
    >
      {online
        ? `${pendingCount} to sync`
        : `${pendingCount} waiting for connection`}
    </span>
  );
}
