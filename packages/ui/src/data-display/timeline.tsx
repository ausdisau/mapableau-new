import * as React from "react";

import { cn } from "../lib/cn";

export interface TimelineItem {
  id: string;
  time?: string;
  title: string;
  subtitle?: string;
  status?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  emptyMessage?: string;
  className?: string;
  renderItem?: (item: TimelineItem) => React.ReactNode;
}

export function Timeline({
  items,
  emptyMessage = "Nothing scheduled yet.",
  className,
  renderItem,
}: TimelineProps) {
  if (!items.length) {
    return (
      <p
        className={cn(
          "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600",
          className,
        )}
        data-testid="mapable-timeline-empty"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol
      className={cn("relative space-y-0", className)}
      data-testid="mapable-timeline"
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className="relative flex gap-4 pb-4 last:pb-0"
          data-testid={`mapable-timeline-item-${item.id}`}
        >
          <div className="flex flex-col items-center">
            <span
              className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#005B7F]"
              aria-hidden="true"
            />
            {index < items.length - 1 ? (
              <span
                className="mt-1 w-px flex-1 bg-slate-200"
                aria-hidden="true"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            {renderItem ? (
              renderItem(item)
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#0C1833]">{item.title}</p>
                    {item.subtitle ? (
                      <p className="text-sm text-slate-600">{item.subtitle}</p>
                    ) : null}
                  </div>
                  {item.time ? (
                    <time className="text-sm font-medium text-slate-600">
                      {item.time}
                    </time>
                  ) : null}
                </div>
                {item.status ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#005B7F]">
                    {item.status}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
