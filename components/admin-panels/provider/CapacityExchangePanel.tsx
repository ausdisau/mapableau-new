import { format } from "date-fns";

import { PanelSection } from "@/components/admin-panels/PanelSection";

type Block = {
  date: Date;
  serviceType: string;
  totalCapacity: number;
  bookedCapacity: number;
};

export function CapacityExchangePanel({
  blocks,
  waitlistCount,
}: {
  blocks: Block[];
  waitlistCount: number;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PanelSection title="Capacity blocks">
        <ul className="space-y-2 text-sm">
          {blocks.map((b, i) => (
            <li key={i} className="flex justify-between rounded-lg border border-border px-3 py-2">
              <span>
                {format(new Date(b.date), "d MMM")} · {b.serviceType}
              </span>
              <span>
                {b.bookedCapacity}/{b.totalCapacity}
              </span>
            </li>
          ))}
        </ul>
      </PanelSection>
      <PanelSection title="Waitlist">
        <p className="text-2xl font-bold">{waitlistCount}</p>
        <p className="text-sm text-muted-foreground">active waitlist requests</p>
      </PanelSection>
    </div>
  );
}
