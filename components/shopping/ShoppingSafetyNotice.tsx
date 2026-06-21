import { SHOPPING_NDIS_NOTE, SHOPPING_SAFETY_DISCLAIMER } from "@/types/shopping";

export function ShoppingSafetyNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {SHOPPING_SAFETY_DISCLAIMER}
      </p>
    );
  }

  return (
    <aside
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      aria-label="Shopping safety notice"
    >
      <p className="font-medium">Before you buy</p>
      <p className="mt-2">{SHOPPING_SAFETY_DISCLAIMER}</p>
      <p className="mt-2 text-amber-900">{SHOPPING_NDIS_NOTE}</p>
    </aside>
  );
}
