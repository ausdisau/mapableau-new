import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type GoalItem = { id?: string; label: string; status?: string };
type SignalItem = { type: string; label: string; status?: string };

type Props = {
  goals: GoalItem[];
  confirmedPreferences: string[];
  functionalAndSupportSignals: SignalItem[];
  recentChanges?: Array<{ label: string; updatedAt?: string }>;
  plainLanguage?: string;
};

export function ParticipantJourneySummary({
  goals,
  confirmedPreferences,
  functionalAndSupportSignals,
  recentChanges = [],
  plainLanguage,
}: Props) {
  return (
    <GraphCardShell
      title="Your support story"
      description="Goals and preferences you have shared or confirmed."
    >
      {plainLanguage ? (
        <p className="rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
          {plainLanguage}
        </p>
      ) : null}

      <section aria-labelledby="journey-goals-heading">
        <h3 id="journey-goals-heading" className="font-semibold">
          Goals
        </h3>
        {goals.length === 0 ? (
          <p className="text-muted-foreground">No goals recorded yet.</p>
        ) : (
          <ul className="list-disc space-y-2 pl-6">
            {goals.map((g) => (
              <li key={g.id ?? g.label}>
                {g.label}
                {g.status ? (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({g.status.replace(/_/g, " ")})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="journey-prefs-heading">
        <h3 id="journey-prefs-heading" className="font-semibold">
          Confirmed preferences
        </h3>
        {confirmedPreferences.length === 0 ? (
          <p className="text-muted-foreground">None confirmed yet.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-6">
            {confirmedPreferences.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="journey-signals-heading">
        <h3 id="journey-signals-heading" className="font-semibold">
          Support and access signals
        </h3>
        <ul className="list-disc space-y-2 pl-6">
          {functionalAndSupportSignals.map((s) => (
            <li key={`${s.type}-${s.label}`}>
              <span className="font-medium">{s.label}</span>
              <span className="text-sm text-muted-foreground">
                {" "}
                — {s.type.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {recentChanges.length > 0 ? (
        <section aria-labelledby="journey-changes-heading">
          <h3 id="journey-changes-heading" className="font-semibold">
            Recent changes
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {recentChanges.map((c) => (
              <li key={c.label}>{c.label}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </GraphCardShell>
  );
}
