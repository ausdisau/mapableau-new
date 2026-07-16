type Props = {
  goal: string;
  wording?: string;
  lifeEventTitle?: string;
};

export function ParticipantGoalCard({ goal, wording, lifeEventTitle }: Props) {
  return (
    <section
      aria-labelledby="continuity-goal-heading"
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 id="continuity-goal-heading" className="text-lg font-semibold text-slate-900">
        Your goal
      </h2>
      {lifeEventTitle ? (
        <p className="mt-1 text-sm text-slate-600">Life event: {lifeEventTitle}</p>
      ) : null}
      <p className="mt-3 text-base text-slate-900">{goal}</p>
      {wording && wording !== goal ? (
        <p className="mt-2 text-sm text-slate-700">
          In your words: <span className="italic">{wording}</span>
        </p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">
        Your original goal stays visible throughout planning and recovery. A service
        failure is never shown as your failure.
      </p>
    </section>
  );
}
