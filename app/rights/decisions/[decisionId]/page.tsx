import { requireAuth } from "@/lib/auth/guards";
import {
  isDecisionRoomEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { getDecisionRoom } from "@/lib/rights-os/decision-room/decision-room-service";

type PageProps = { params: Promise<{ decisionId: string }> };

export default async function DecisionRoomPage({ params }: PageProps) {
  const user = await requireAuth();
  const { decisionId } = await params;

  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return <p>Decision Room is not enabled.</p>;
  }

  const room = await getDecisionRoom(decisionId, user.id);
  if (!room) return <p>Decision not found.</p>;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-heading text-xl font-semibold">{room.title}</h2>
        <p className="mt-2">{room.question}</p>
      </header>

      <section aria-labelledby="options-heading">
        <h3 id="options-heading" className="font-medium">
          Options
        </h3>
        <ul className="mt-2 space-y-2">
          {room.options.map((option) => (
            <li key={option.id} className="rounded-md border p-3">
              <p className="font-medium">{option.label}</p>
              {option.description ? (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {room.supporters.length > 0 ? (
        <section aria-labelledby="supporters-heading">
          <h3 id="supporters-heading" className="font-medium">
            Supporter contributions
          </h3>
          <ul className="mt-2 space-y-2">
            {room.supporters.map((s) => (
              <li key={s.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">Supporter ({s.authorityScope})</p>
                {s.contributions.map((c) => (
                  <p key={c.id} className="mt-1">
                    {c.content}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {room.dissents.length > 0 ? (
        <section aria-labelledby="dissent-heading" className="rounded-md border border-amber-500/40 p-4">
          <h3 id="dissent-heading" className="font-medium">
            Supporter dissent (visible)
          </h3>
          <ul className="mt-2 space-y-2">
            {room.dissents.map((d) => (
              <li key={d.id} className="text-sm">
                {d.content}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {room.records.length > 0 ? (
        <section aria-labelledby="record-heading">
          <h3 id="record-heading" className="font-medium">
            Your decision
          </h3>
          {room.records.map((record) => (
            <div key={record.id} className="mt-2 rounded-md border p-3 text-sm">
              <p>{record.participantWording}</p>
              <p className="text-xs text-muted-foreground">
                Recorded {record.decidedAt.toLocaleString("en-AU")}
              </p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
