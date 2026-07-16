export function ParticipantGoalCard(props: {
  goal: string;
  wording?: string;
  typeKey?: string;
  status?: string;
}) {
  return (
    <section
      aria-labelledby="continuity-goal-heading"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 id="continuity-goal-heading" className="text-lg font-semibold text-slate-900">
        Your goal
      </h2>
      <p className="mt-2 text-base text-slate-800">{props.goal}</p>
      {props.wording && props.wording !== props.goal ? (
        <p className="mt-2 text-sm text-slate-600">
          In your words: {props.wording}
        </p>
      ) : null}
      <dl className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
        {props.typeKey ? (
          <>
            <dt className="font-medium">Life event</dt>
            <dd>{props.typeKey}</dd>
          </>
        ) : null}
        {props.status ? (
          <>
            <dt className="font-medium">Status</dt>
            <dd>{props.status}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}
