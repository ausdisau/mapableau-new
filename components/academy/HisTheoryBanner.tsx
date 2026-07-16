import {
  HIS_PRACTICAL_WARNING,
  HIS_THEORY_LABEL,
} from "@/lib/academy/config";

export function HisTheoryBanner({
  show,
}: {
  show: boolean;
}) {
  if (!show) return null;
  return (
    <aside
      className="rounded border border-amber-700 bg-amber-50 p-4 text-sm text-amber-950"
      role="note"
      aria-label={HIS_THEORY_LABEL}
    >
      <p className="font-semibold">{HIS_THEORY_LABEL}</p>
      <p className="mt-1">{HIS_PRACTICAL_WARNING}</p>
    </aside>
  );
}
