import { format } from "date-fns";

import { PanelSection } from "@/components/admin-panels/PanelSection";

type TimelineEntry = {
  id: string;
  kind: string;
  title: string;
  at: Date;
  status?: string;
};

export function ParticipantTimeline({
  entries,
}: {
  entries: TimelineEntry[];
}) {
  return (
    <PanelSection title="Your timeline">
      <ol className="relative border-l border-border pl-6">
        {entries.map((e) => (
          <li key={e.id} className="mb-6">
            <span
              className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary"
              aria-hidden
            />
            <p className="text-xs uppercase text-muted-foreground">{e.kind}</p>
            <p className="font-medium">{e.title}</p>
            <time className="text-sm text-muted-foreground" dateTime={e.at.toISOString()}>
              {format(e.at, "d MMM yyyy, h:mm a")}
            </time>
            {e.status ? (
              <p className="text-sm text-muted-foreground">Status: {e.status}</p>
            ) : null}
          </li>
        ))}
      </ol>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timeline events yet.</p>
      ) : null}
    </PanelSection>
  );
}
