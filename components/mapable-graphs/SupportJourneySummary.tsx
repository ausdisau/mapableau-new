import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type Need = { id?: string; label: string; status?: string };

type Props = {
  goal?: string;
  supportNeeds: Need[];
  suggestedSupports: Array<{ label: string; status?: string }>;
  participantDecisions?: Array<{ label: string; status?: string }>;
  nextReview?: string | null;
  reliabilityWarning?: string;
  plainLanguage?: string;
};

export function SupportJourneySummary({
  goal,
  supportNeeds,
  suggestedSupports,
  participantDecisions = [],
  nextReview,
  reliabilityWarning,
  plainLanguage,
}: Props) {
  return (
    <GraphCardShell
      title="Your support pathway"
      description="Needs, suggestions, and decisions — nothing is booked without your confirmation."
    >
      {plainLanguage ? <p>{plainLanguage}</p> : null}
      {reliabilityWarning ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 font-medium"
        >
          {reliabilityWarning}
        </p>
      ) : null}
      {goal ? (
        <p>
          <span className="font-semibold">Linked goal:</span> {goal}
        </p>
      ) : null}

      <section aria-labelledby="support-needs-heading">
        <h3 id="support-needs-heading" className="font-semibold">
          Support needs
        </h3>
        <ul className="list-disc space-y-2 pl-6">
          {supportNeeds.map((n) => (
            <li key={n.id ?? n.label}>
              {n.label}
              {n.status === "draft" ? (
                <span className="ml-2 text-sm text-amber-700 dark:text-amber-400">
                  — needs your confirmation
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="support-suggestions-heading">
        <h3 id="support-suggestions-heading" className="font-semibold">
          Suggested supports
        </h3>
        {suggestedSupports.length === 0 ? (
          <p className="text-muted-foreground">No suggestions yet.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-6">
            {suggestedSupports.map((s) => (
              <li key={s.label}>{s.label}</li>
            ))}
          </ul>
        )}
      </section>

      {participantDecisions.length > 0 ? (
        <section aria-labelledby="support-decisions-heading">
          <h3 id="support-decisions-heading" className="font-semibold">
            Your decisions
          </h3>
          <ul className="list-disc space-y-1 pl-6">
            {participantDecisions.map((d) => (
              <li key={d.label}>
                {d.label} — {d.status?.replace(/_/g, " ") ?? "pending"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nextReview ? (
        <p className="text-sm text-muted-foreground">
          Next review: {nextReview}
        </p>
      ) : null}
    </GraphCardShell>
  );
}
