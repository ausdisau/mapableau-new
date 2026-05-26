"use client";

import { cn } from "@/app/lib/utils";
import {
  ACCESS_NEEDS,
  FUNDING_OPTIONS,
  SUPPORT_TYPES,
  type SupportTypeId,
} from "@/lib/provider-finder/filters";

type ProviderFinderSidebarProps = {
  supportType: SupportTypeId;
  onSupportTypeChange: (id: SupportTypeId) => void;
  accessNeeds: string[];
  onAccessNeedsChange: (ids: string[]) => void;
  funding: (typeof FUNDING_OPTIONS)[number]["id"];
  onFundingChange: (id: (typeof FUNDING_OPTIONS)[number]["id"]) => void;
};

export function ProviderFinderSidebar({
  supportType,
  onSupportTypeChange,
  accessNeeds,
  onAccessNeedsChange,
  funding,
  onFundingChange,
}: ProviderFinderSidebarProps) {
  function toggleAccessNeed(id: string) {
    onAccessNeedsChange(
      accessNeeds.includes(id)
        ? accessNeeds.filter((x) => x !== id)
        : [...accessNeeds, id],
    );
  }

  return (
    <aside
      className="space-y-7 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
      aria-label="Refine search"
    >
      <div>
        <h2 className="text-lg font-black tracking-[-0.02em] text-foreground">
          Refine search
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Narrow results by support type, access needs and funding.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Support type
        </h3>
        <ul className="mt-3 space-y-1">
          {SUPPORT_TYPES.map((type) => (
            <li key={type.id}>
              <button
                type="button"
                onClick={() => onSupportTypeChange(type.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                  supportType === type.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-slate-50 text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-pressed={supportType === type.id}
              >
                {type.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Access needs
        </h3>
        <div className="mt-3 grid gap-2">
          {ACCESS_NEEDS.map((need) => {
            const active = accessNeeds.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                onClick={() => toggleAccessNeed(need.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 bg-white text-foreground hover:border-primary/30 hover:bg-accent",
                )}
                aria-pressed={active}
              >
                {need.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Funding
        </h3>
        <div className="mt-3 space-y-1">
          {FUNDING_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onFundingChange(option.id)}
              className={cn(
                "w-full rounded-xl px-3 py-2 text-left text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                funding === option.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "bg-slate-50 text-foreground hover:bg-accent",
              )}
              aria-pressed={funding === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
