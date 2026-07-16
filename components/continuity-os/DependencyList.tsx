type DependencyRow = {
  label: string;
  state: string;
  owner: string;
  required: boolean;
  alternative?: string;
};

type Props = {
  items: DependencyRow[];
  unknowns?: string[];
  blockers?: string[];
  singlePointsOfFailure?: string[];
};

export function DependencyList({
  items,
  unknowns = [],
  blockers = [],
  singlePointsOfFailure = [],
}: Props) {
  return (
    <section aria-labelledby="dependency-list-heading" className="space-y-4">
      <h2 id="dependency-list-heading" className="text-lg font-semibold text-slate-900">
        Dependencies
      </h2>
      <p className="text-sm text-slate-600">
        Structured list alternative to any dependency graph. Unknown stays unknown.
      </p>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {items.map((item) => (
          <li key={item.label} className="p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-slate-900">{item.label}</span>
              <span className="text-sm text-slate-700">
                State: <strong>{item.state}</strong>
                {item.required ? " · required" : " · optional"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">Owner: {item.owner}</p>
            {item.alternative ? (
              <p className="mt-1 text-sm text-slate-600">
                Alternative hint: {item.alternative}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {unknowns.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Unknowns preserved</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {blockers.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Blockers</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {singlePointsOfFailure.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Single points of failure
          </h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {singlePointsOfFailure.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
