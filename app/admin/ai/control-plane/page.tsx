import { buildControlPlaneDashboard } from "@/lib/ai/platform/control-plane";
import { requireAdmin } from "@/lib/auth/guards";
import { isAiControlPlaneEnabled } from "@/lib/config/ai-control-plane";

export default async function AdminAiControlPlanePage() {
  await requireAdmin();

  if (!isAiControlPlaneEnabled()) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-bold">AI Control Plane</h1>
        <p className="max-w-3xl text-muted-foreground" role="status">
          Control plane is disabled. Set{" "}
          <code>MAPABLE_AI_CONTROL_PLANE_ENABLED=true</code> in a non-production
          environment to view system health metrics. This surface never scores
          participants.
        </p>
      </div>
    );
  }

  const dash = buildControlPlaneDashboard();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">AI Control Plane</h1>
        <p className="max-w-3xl text-muted-foreground">{dash.privacyNote}</p>
        <p className="text-sm" role="status" aria-live="polite">
          Overall health:{" "}
          <span className="font-medium">{dash.overallHealth}</span>
          {" · "}
          Generated {dash.generatedAt}
        </p>
      </header>

      <section aria-labelledby="subsystems-heading" className="space-y-2">
        <h2 id="subsystems-heading" className="text-lg font-semibold">
          Subsystem health
        </h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Control-plane subsystem health status
            </caption>
            <thead className="bg-muted/40">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  Subsystem
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {dash.subsystems.map((row) => (
                <tr key={row.subsystem} className="border-t">
                  <td className="p-3 font-mono text-xs">{row.subsystem}</td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3 text-muted-foreground">
                    {row.notes.length ? row.notes.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="spend-heading" className="space-y-2">
        <h2 id="spend-heading" className="text-lg font-semibold">
          Model spend (aggregates)
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Total tokens: {dash.modelSpend.totalTokens}</li>
          <li>Total model calls: {dash.modelSpend.totalModelCalls}</li>
          <li>Budget exhaustions: {dash.modelSpend.budgetExhaustions}</li>
        </ul>
      </section>

      <section aria-labelledby="queues-heading" className="space-y-2">
        <h2 id="queues-heading" className="text-lg font-semibold">
          Queue health
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Human-review backlog: {dash.queueHealth.humanReviewBacklog}</li>
          <li>Pending actions (estimate): {dash.queueHealth.pendingActions}</li>
        </ul>
      </section>

      <section aria-labelledby="flags-heading" className="space-y-2">
        <h2 id="flags-heading" className="text-lg font-semibold">
          Feature flags & kill switches
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {dash.featureFlags.map((f) => (
            <li key={f.name}>
              <code>{f.name}</code>: {f.enabled ? "on" : "off"}
            </li>
          ))}
          {dash.killSwitches.map((k) => (
            <li key={k.name}>
              <code>{k.name}</code>: {k.engaged ? "engaged" : "clear"}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="alerts-heading" className="space-y-2">
        <h2 id="alerts-heading" className="text-lg font-semibold">
          Recent alerts
        </h2>
        {dash.recentAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent alerts.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {dash.recentAlerts.map((a) => (
              <li key={a.id} className="rounded border p-2">
                <span className="font-medium">{a.kind}</span> · {a.severity} ·{" "}
                <code>{a.reasonCode}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="slo-heading" className="space-y-2">
        <h2 id="slo-heading" className="text-lg font-semibold">
          SLO candidates (targets configurable)
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {dash.sloCandidates.map((s) => (
            <li key={s.id}>
              <code>{s.id}</code> — target:{" "}
              {s.target === null ? "unconfigured" : s.target} ({s.unit})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
