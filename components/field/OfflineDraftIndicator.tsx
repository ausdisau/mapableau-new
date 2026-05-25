export function OfflineDraftIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <p
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      role="status"
      aria-live="polite"
    >
      Draft saved on this device. It will sync when you are online.
    </p>
  );
}
