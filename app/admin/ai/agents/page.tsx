import {
  listMapAbleAgents,
  validateMapAbleAgentRegistry,
} from "@/lib/ai/platform/agents";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { isCapabilityKilled } from "@/lib/ai/platform/policies/kill-switches";
import { requireAdmin } from "@/lib/auth/guards";

function statusLabel(input: {
  allCapsDisabled: boolean;
  anyKilled: boolean;
}): { text: string; code: string } {
  if (input.anyKilled) {
    return {
      text: "Degraded — kill switch engaged; non-AI fallback available",
      code: "degraded",
    };
  }
  if (input.allCapsDisabled) {
    return {
      text: "Unavailable — dependent feature flags off",
      code: "unavailable",
    };
  }
  return {
    text: "Registered — operational agent in nerve centre",
    code: "registered",
  };
}

export default async function AdminAiAgentsPage() {
  await requireAdmin();
  const validation = validateMapAbleAgentRegistry();
  const agents = listMapAbleAgents();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          MapAble Agentic Nerve Centre
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Canonical operational agents (maximum eight). Capabilities, authority
          ceilings, consent scopes, kill switches and evaluation suites are
          shown for governance. This page does not enable autonomous execution.
        </p>
        <p
          className="text-sm"
          role="status"
          aria-live="polite"
        >
          Registry validation:{" "}
          <span className="font-medium">
            {validation.ok ? "pass" : "fail — fail closed"}
          </span>
          {!validation.ok && (
            <span className="ml-2 text-destructive">
              ({validation.issues.length} issue
              {validation.issues.length === 1 ? "" : "s"})
            </span>
          )}
        </p>
      </header>

      <div className="overflow-x-auto rounded border">
        <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Canonical MapAble operational agents with status, domains,
            capabilities, authority, consent, kill switches and evaluation
            suites
          </caption>
          <thead className="bg-muted/40">
            <tr>
              <th scope="col" className="p-3 font-semibold">
                Agent
              </th>
              <th scope="col" className="p-3 font-semibold">
                Status
              </th>
              <th scope="col" className="p-3 font-semibold">
                Domains
              </th>
              <th scope="col" className="p-3 font-semibold">
                Capabilities
              </th>
              <th scope="col" className="p-3 font-semibold">
                Backend mix
              </th>
              <th scope="col" className="p-3 font-semibold">
                Authority ceiling
              </th>
              <th scope="col" className="p-3 font-semibold">
                Human review
              </th>
              <th scope="col" className="p-3 font-semibold">
                Consent scopes
              </th>
              <th scope="col" className="p-3 font-semibold">
                Feature flags
              </th>
              <th scope="col" className="p-3 font-semibold">
                Kill switches
              </th>
              <th scope="col" className="p-3 font-semibold">
                Evaluation suite
              </th>
              <th scope="col" className="p-3 font-semibold">
                Fallback
              </th>
              <th scope="col" className="p-3 font-semibold">
                Last review
              </th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const caps = agent.capabilityKeys.map((key) => {
                const cap = getAiCapability(key);
                return {
                  key,
                  cap,
                  killed: isCapabilityKilled(key),
                  flagOn: cap ? process.env[cap.featureFlag] === "true" : false,
                };
              });
              const backends = [
                ...new Set(
                  caps
                    .map((c) => c.cap?.backend)
                    .filter((b): b is NonNullable<typeof b> => Boolean(b))
                ),
              ];
              const anyKilled = caps.some((c) => c.killed);
              const allCapsDisabled =
                caps.length > 0 && caps.every((c) => !c.flagOn);
              const status = statusLabel({ allCapsDisabled, anyKilled });

              return (
                <tr key={agent.id} className="border-t align-top">
                  <th scope="row" className="p-3 font-medium">
                    <div>{agent.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {agent.id}
                    </div>
                  </th>
                  <td className="p-3">
                    <span
                      className={
                        status.code === "registered"
                          ? "text-foreground"
                          : status.code === "degraded"
                            ? "font-medium underline decoration-dashed"
                            : "font-medium"
                      }
                      aria-label={status.text}
                    >
                      {status.code}
                    </span>
                    <span className="sr-only"> — {status.text}</span>
                  </td>
                  <td className="p-3">{agent.domains.join(", ")}</td>
                  <td className="p-3">
                    <ul className="list-disc pl-4">
                      {agent.capabilityKeys.map((key) => (
                        <li key={key} className="font-mono text-xs">
                          {key}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3">{backends.join(", ") || "n/a"}</td>
                  <td className="p-3 font-mono text-xs">
                    {agent.authorityCeiling}
                  </td>
                  <td className="p-3">
                    {agent.requiredHumanReviewFor.length > 0
                      ? agent.requiredHumanReviewFor.join(", ")
                      : "none declared"}
                  </td>
                  <td className="p-3">
                    {agent.requiredConsentScopes.length > 0
                      ? agent.requiredConsentScopes.join(", ")
                      : "none"}
                  </td>
                  <td className="p-3">
                    <ul className="list-disc pl-4">
                      {caps.map((c) => (
                        <li key={c.key} className="text-xs">
                          <span className="font-mono">
                            {c.cap?.featureFlag ?? "unknown"}
                          </span>
                          : {c.flagOn ? "on" : "off"}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3">
                    <ul className="list-disc pl-4">
                      {caps.map((c) => (
                        <li key={c.key} className="text-xs">
                          <span className="font-mono">
                            {c.cap?.killSwitchKey ?? c.key}
                          </span>
                          : {c.killed ? "engaged" : "clear"}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {agent.evaluationSuite}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {agent.fallbackAgentId}
                  </td>
                  <td className="p-3">{agent.lastReview}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Touch targets and keyboard access follow the semantic table. Status is
        conveyed in text, not colour alone. Robotics remains research-only and
        is not listed as an operational agent. Safeguarding is a human
        escalation gate, not an operational agent.
      </p>
    </div>
  );
}
