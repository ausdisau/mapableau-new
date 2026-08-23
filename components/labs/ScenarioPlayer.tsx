import type { LabScenario, ScenarioState } from "@/lib/labs/contracts";

export function ScenarioPlayer({
  scenario,
  state,
}: {
  scenario: LabScenario;
  state: ScenarioState;
}) {
  const current = scenario.nodes.find((n) => n.id === state.currentNodeId);
  const mode = state.presentationMode;

  return (
    <section
      className="rounded-3xl border border-white/10 bg-white/[0.045] p-5"
      aria-labelledby="scenario-player-heading"
      aria-live="polite"
    >
      <h2 id="scenario-player-heading" className="text-xl font-black">
        Journey
      </h2>
      <p className="mt-1 text-sm text-white/60" role="status">
        Phase: {state.phase.replace(/_/g, " ")}
        {current ? ` · At ${current.label}` : ""}
      </p>

      {mode === "TEXT" ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-white/80">
          <ol className="list-decimal space-y-2 pl-5">
            {scenario.path.map((nodeId, index) => {
              const node = scenario.nodes.find((n) => n.id === nodeId);
              const reached = index <= state.pathIndex;
              return (
                <li
                  key={nodeId}
                  className={reached ? "text-white" : "text-white/45"}
                  aria-current={nodeId === state.currentNodeId ? "step" : undefined}
                >
                  <span className="font-bold">{node?.label}</span>
                  {node?.description ? ` — ${node.description}` : ""}
                </li>
              );
            })}
          </ol>
          {state.pendingEvent ? (
            <p className="rounded-xl border border-[#F8C51C]/30 bg-[#F8C51C]/10 p-3">
              <span className="font-black">{state.pendingEvent.title}. </span>
              {state.pendingEvent.description}
              {state.pendingEvent.evidenceState === "UNKNOWN"
                ? " Evidence state: unknown."
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "SIMPLIFIED_2D" || mode === "STANDARD_VISUAL" ? (
        <ol
          className={`mt-5 grid gap-2 ${mode === "SIMPLIFIED_2D" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}
          aria-label="Journey nodes"
        >
          {scenario.path.map((nodeId, index) => {
            const node = scenario.nodes.find((n) => n.id === nodeId);
            const active = nodeId === state.currentNodeId;
            const passed = index < state.pathIndex;
            return (
              <li
                key={nodeId}
                aria-current={active ? "step" : undefined}
                className={`min-h-20 rounded-2xl border px-3 py-3 text-sm ${
                  active
                    ? "border-[#F8C51C] bg-[#F8C51C]/15"
                    : passed
                      ? "border-white/25 bg-white/10"
                      : "border-white/10 bg-transparent text-white/50"
                }`}
              >
                <span className="block text-xs font-black uppercase tracking-wide">
                  {node?.kind}
                </span>
                <span className="mt-1 block font-bold">{node?.label}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {mode !== "TEXT" && state.pendingEvent ? (
        <p
          className="mt-4 rounded-xl border border-[#F8C51C]/30 bg-[#F8C51C]/10 p-3 text-sm leading-6"
          role="status"
        >
          <span className="font-black">{state.pendingEvent.title}. </span>
          {state.pendingEvent.description}
          {state.pendingEvent.evidenceState === "UNKNOWN"
            ? " Evidence: unknown."
            : null}
        </p>
      ) : null}
    </section>
  );
}
