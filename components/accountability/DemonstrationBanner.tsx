import { DEMONSTRATION_DATA_BANNER } from "@/lib/config/accountability";

export function DemonstrationBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      {DEMONSTRATION_DATA_BANNER}
    </div>
  );
}
