"use client";

import { cn } from "@/app/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

export function NestedTabPanels({
  tabs,
  activeId,
  onChange,
  nestedTabs,
  nestedActiveId,
  onNestedChange,
  ariaLabel,
  nestedAriaLabel,
  className,
}: {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  nestedTabs?: TabItem[];
  nestedActiveId?: string;
  onNestedChange?: (id: string) => void;
  ariaLabel: string;
  nestedAriaLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border bg-muted/30", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 px-3 py-2"
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground hover:bg-accent"
              )}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tabs, activeId, onChange)}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    selected ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                  aria-label={`${tab.badge} items`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {nestedTabs?.length && onNestedChange && nestedActiveId ? (
        <div
          role="tablist"
          aria-label={nestedAriaLabel ?? "Sub-filters"}
          className="flex flex-wrap gap-1 border-t border-border/60 px-3 py-2 pl-6"
        >
          {nestedTabs.map((tab) => {
            const selected = tab.id === nestedActiveId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`nested-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`nested-tabpanel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-background text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
                onClick={() => onNestedChange(tab.id)}
                onKeyDown={(e) =>
                  handleTabKeyDown(e, nestedTabs, nestedActiveId, onNestedChange)
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function handleTabKeyDown(
  e: React.KeyboardEvent<HTMLButtonElement>,
  tabs: TabItem[],
  activeId: string,
  onChange: (id: string) => void
) {
  const idx = tabs.findIndex((t) => t.id === activeId);
  if (idx < 0) return;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    onChange(tabs[(idx + 1) % tabs.length]!.id);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    onChange(tabs[(idx - 1 + tabs.length) % tabs.length]!.id);
  } else if (e.key === "Home") {
    e.preventDefault();
    onChange(tabs[0]!.id);
  } else if (e.key === "End") {
    e.preventDefault();
    onChange(tabs[tabs.length - 1]!.id);
  }
}
