import type { AccessSearchResult } from "@/types/access-chat";

const FIT_LABELS: Record<
  AccessSearchResult["fit"]["label"],
  { text: string; symbol: string }
> = {
  likely_suitable: { text: "Likely suitable", symbol: "✓" },
  suitable_with_caution: { text: "Suitable with caution", symbol: "!" },
  not_enough_information: { text: "Not enough information", symbol: "?" },
  likely_unsuitable: { text: "Likely unsuitable", symbol: "×" },
};

export function AccessFitBadge({
  label,
  confidence,
}: {
  label: AccessSearchResult["fit"]["label"];
  confidence: number;
}) {
  const meta = FIT_LABELS[label];
  return (
    <span
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-slate-800 bg-white px-3 py-1 text-sm font-semibold text-[#0C1833]"
      role="status"
      aria-label={`${meta.text}. Confidence ${Math.round(confidence * 100)} percent.`}
    >
      <span aria-hidden="true" className="font-black">
        {meta.symbol}
      </span>
      <span>{meta.text}</span>
      <span className="text-slate-600">
        · {Math.round(confidence * 100)}% confidence
      </span>
    </span>
  );
}
