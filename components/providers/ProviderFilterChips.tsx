"use client";

import { cn } from "@/app/lib/utils";

export function ProviderFilterChips({
  chips,
  activeId,
  onSelect,
}: {
  chips: { id: string; label: string }[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Quick filters"
    >
      {chips.map((chip) => {
        const active = activeId === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : chip.id)}
            className={cn(
              "shrink-0 min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
