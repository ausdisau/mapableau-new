import * as React from "react";

import { cn } from "../lib/cn";
import { StatusChip, type StatusChipTone } from "../primitives/status-chip";

export interface BookingRowProps {
  title: string;
  time: string;
  status: string;
  statusTone?: StatusChipTone;
  className?: string;
}

export function BookingRow({
  title,
  time,
  status,
  statusTone = "default",
  className,
}: BookingRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3",
        className,
      )}
      data-testid="mapable-booking-row"
    >
      <div>
        <p className="font-semibold capitalize text-[#0C1833]">{title}</p>
        <p className="text-sm text-slate-600">{time}</p>
      </div>
      <StatusChip tone={statusTone} label={status.replace(/_/g, " ")} />
    </div>
  );
}
