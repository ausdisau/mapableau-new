import React from "react";

import { cn } from "@/app/lib/utils";
import type { RegistrationSlot } from "@/types/registration-chat";

const SLOT_LABELS: Record<RegistrationSlot, string> = {
  name: "Name",
  email: "Email",
  password: "Password",
};

type Props = {
  filledSlots?: Partial<Record<RegistrationSlot, boolean>>;
  className?: string;
};

export function RegistrationSlotProgress({ filledSlots, className }: Props) {
  const slots = (["name", "email", "password"] as const).map((slot) => ({
    slot,
    label: SLOT_LABELS[slot],
    filled: Boolean(filledSlots?.[slot]),
  }));

  return (
    <div
      className={cn("flex flex-wrap gap-2 text-xs", className)}
      aria-label="Registration details collected"
    >
      {slots.map(({ slot, label, filled }) => (
        <span
          key={slot}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
            filled
              ? "bg-[#005B7F]/15 text-[#005B7F]"
              : "border border-slate-200 bg-white text-slate-500",
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              filled ? "bg-[#005B7F]" : "bg-slate-300",
            )}
            aria-hidden
          />
          {label}
        </span>
      ))}
    </div>
  );
}
