import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type Props = {
  goalProgress?: string[];
  recentOutcomes?: Array<{ label: string; outcomeType?: string }>;
  whatWorked?: string[];
  whatNeedsChanging?: string[];
};

export function OutcomeProgressCard({
  goalProgress = [],
  recentOutcomes = [],
  whatWorked = [],
  whatNeedsChanging = [],
}: Props) {
  return (
    <GraphCardShell
      title="How did it go?"
      description="Outcomes help improve suggestions. Support is never automatically reduced."
    >
      {goalProgress.length > 0 ? (
        <section aria-labelledby="outcome-goals-heading">
          <h3 id="outcome-goals-heading" className="font-semibold">
            Goal progress
          </h3>
          <ul className="list-disc pl-6">
            {goalProgress.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {recentOutcomes.length > 0 ? (
        <section aria-labelledby="outcome-recent-heading">
          <h3 id="outcome-recent-heading" className="font-semibold">
            Recent outcomes
          </h3>
          <ul className="list-disc pl-6">
            {recentOutcomes.map((o) => (
              <li key={o.label}>{o.label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {whatWorked.length > 0 ? (
        <section aria-labelledby="outcome-worked-heading">
          <h3 id="outcome-worked-heading" className="font-semibold">
            What worked
          </h3>
          <ul className="list-disc pl-6">
            {whatWorked.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {whatNeedsChanging.length > 0 ? (
        <section aria-labelledby="outcome-change-heading">
          <h3 id="outcome-change-heading" className="font-semibold">
            What to change next
          </h3>
          <ul className="list-disc pl-6">
            {whatNeedsChanging.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </GraphCardShell>
  );
}
