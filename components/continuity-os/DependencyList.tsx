import type { LifeEventDependencyNode } from "@/lib/continuity-os/types";

export function DependencyList(props: {
  nodes: LifeEventDependencyNode[];
  singlePointsOfFailure?: string[];
}) {
  const spoFs = new Set(props.singlePointsOfFailure ?? []);

  return (
    <section aria-labelledby="dependency-list-heading">
      <h2 id="dependency-list-heading" className="text-lg font-semibold text-slate-900">
        Dependencies
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Structured list alternative to any graph view. Unknown stays unknown.
      </p>
      <ul className="mt-4 space-y-3">
        {props.nodes.map((node) => (
          <li
            key={node.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium text-slate-900">{node.label}</h3>
              <span className="text-sm text-slate-700">
                State: <strong>{node.state}</strong>
                {node.required ? " · required" : " · optional"}
                {spoFs.has(node.id) ? " · single point of failure" : ""}
              </span>
            </div>
            {node.unknownReason ? (
              <p className="mt-2 text-sm text-amber-800">{node.unknownReason}</p>
            ) : null}
            <dl className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              <dt className="font-medium">Owner</dt>
              <dd>{node.owner}</dd>
              <dt className="font-medium">MapAble role</dt>
              <dd>{node.responsibility.mapAbleRole}</dd>
              <dt className="font-medium">Your role</dt>
              <dd>{node.responsibility.participantRole}</dd>
              <dt className="font-medium">Recovery responsibility</dt>
              <dd>{node.responsibility.recoveryResponsibility}</dd>
              <dt className="font-medium">Complaint route</dt>
              <dd>{node.responsibility.complaintRoute}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
