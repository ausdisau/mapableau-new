"use client";

import type { AppliedFieldKey } from "@/lib/provider/finder/merge-applied";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";

export type ChatFirstFilterChip = {
  key: AppliedFieldKey;
  label: string;
  value: string;
};

export function chipsFromApplied(
  applied: AppliedSearchFields,
): ChatFirstFilterChip[] {
  const chips: ChatFirstFilterChip[] = [];
  if (applied.serviceQuery.trim()) {
    chips.push({
      key: "serviceQuery",
      label: "Service",
      value: applied.serviceQuery.trim(),
    });
  }
  if (applied.location.trim()) {
    chips.push({
      key: "location",
      label: "Area",
      value: applied.location.trim(),
    });
  }
  if (applied.accessQuery.trim() || applied.accessNeedIds.length > 0) {
    chips.push({
      key: "accessQuery",
      label: "Communication / access",
      value:
        applied.accessQuery.trim() || applied.accessNeedIds.join(", "),
    });
  }
  if (applied.providerName.trim()) {
    chips.push({
      key: "providerName",
      label: "Provider name",
      value: applied.providerName.trim(),
    });
  }
  if (applied.query.trim()) {
    chips.push({
      key: "query",
      label: "Search",
      value: applied.query.trim(),
    });
  }
  return chips;
}

type Props = {
  applied: AppliedSearchFields;
  onEdit: (key: AppliedFieldKey) => void;
  onRemove: (key: AppliedFieldKey) => void;
};

export function ChatFirstFilterChips({ applied, onEdit, onRemove }: Props) {
  const chips = chipsFromApplied(applied);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Current search filters">
      {chips.map((chip) => (
        <div
          key={chip.key}
          role="listitem"
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-1 text-sm"
        >
          <span className="pl-2 font-medium text-foreground">
            {chip.label}: {chip.value}
          </span>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-full px-2 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onEdit(chip.key)}
            aria-label={`Edit ${chip.label} filter`}
          >
            Edit
          </button>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-full px-2 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
