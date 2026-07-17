import Link from "next/link";

import {
  getAccessibilityOpsFeatureFlags,
  getAccessibilityOpsMode,
} from "@/lib/accessibility-ops/feature-flags";
import { probeAccessIntelligenceCompose } from "@/lib/accessibility-ops/compose/access-intelligence-adapter";
import { probeAuraCompose } from "@/lib/accessibility-ops/compose/aura-adapter";

export default function AccessibilityOpsOverviewPage() {
  const flags = getAccessibilityOpsFeatureFlags();
  const mode = getAccessibilityOpsMode();
  const ai = probeAccessIntelligenceCompose();
  const aura = probeAuraCompose();

  const flagRows = Object.entries(flags).map(([key, value]) => ({
    key,
    value: value ? "on" : "off",
  }));

  return (
    <div className="space-y-8">
      <section aria-labelledby="ops-status-heading" className="space-y-3">
        <h2 id="ops-status-heading" className="text-xl font-semibold">
          Operating status
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <dt className="text-sm text-muted-foreground">Mode</dt>
            <dd className="font-medium">{mode}</dd>
          </div>
          <div className="rounded-md border border-border p-3">
            <dt className="text-sm text-muted-foreground">Release blocking</dt>
            <dd className="font-medium">Disabled in Wave 1</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="compose-heading" className="space-y-3">
        <h2 id="compose-heading" className="text-xl font-semibold">
          Composition (no parallel SoT)
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            Access Intelligence: {ai.status}
            {ai.regressionRunner ? " — regression bridge ready" : " — bridge not registered on this build"}
          </li>
          <li>
            AURA / CareOSMission: {aura.status}
            {aura.careOsMissionAvailable
              ? " — mission SoT available"
              : " — unavailable on main; do not invent AuraMission"}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">{aura.invariant}</p>
      </section>

      <section aria-labelledby="flags-heading" className="space-y-3">
        <h2 id="flags-heading" className="text-xl font-semibold">
          Feature flags
        </h2>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">AccessibilityOps feature flags</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 font-medium">
                Flag
              </th>
              <th scope="col" className="py-2 font-medium">
                State
              </th>
            </tr>
          </thead>
          <tbody>
            {flagRows.map((row) => (
              <tr key={row.key} className="border-b border-border/60">
                <td className="py-2 pr-4 font-mono text-xs">{row.key}</td>
                <td className="py-2">
                  <span className="sr-only">State: </span>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="next-heading" className="space-y-2">
        <h2 id="next-heading" className="text-xl font-semibold">
          Read-only operations
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <Link className="underline" href="/accessibility-ops/assets">
              Browse registered assets
            </Link>
          </li>
          <li>
            <Link className="underline" href="/accessibility-ops/rules">
              Browse versioned rules
            </Link>
          </li>
          <li>
            <Link className="underline" href="/accessibility-ops/pilot">
              Seed shadow pilot assets
            </Link>
          </li>
          <li>
            Documentation: <code>docs/accessibility-ops/</code> in the repository
          </li>
        </ul>
      </section>
    </div>
  );
}
