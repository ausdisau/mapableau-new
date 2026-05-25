import { format } from "date-fns";

import { PanelSection } from "@/components/admin-panels/PanelSection";

type Shift = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  workerProfile: { displayName: string } | null;
  participant: { name: string };
};

export function RosterCalendar({ shifts }: { shifts: Shift[] }) {
  return (
    <PanelSection title="Roster calendar">
      <ul className="space-y-2">
        {shifts.map((s) => (
          <li key={s.id} className="rounded-lg border border-border px-3 py-2 text-sm">
            <span className="font-medium">
              {format(new Date(s.startAt), "EEE d MMM h:mm a")} –{" "}
              {format(new Date(s.endAt), "h:mm a")}
            </span>
            <p className="text-muted-foreground">
              {s.participant.name} · {s.workerProfile?.displayName ?? "Unassigned"}
            </p>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
