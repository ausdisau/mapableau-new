import Link from "next/link";

import { AuraDisclaimerBanner } from "@/components/aura/AuraDisclaimerBanner";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/aura/agents", label: "Agents & manifests" },
  { href: "/admin/aura/models", label: "AI model profiles" },
  { href: "/admin/aura/prompts", label: "Prompt bundles" },
  { href: "/admin/aura/tools", label: "Tool registry" },
  { href: "/admin/aura/protocols", label: "Protocols (MCP / A2A)" },
  { href: "/admin/aura/evaluations", label: "Evaluations" },
  { href: "/admin/aura/safety", label: "Safety holds & kill switches" },
  { href: "/admin/aura/incidents", label: "Incident candidates" },
  { href: "/admin/aura/outcomes", label: "Outcome calibration" },
  { href: "/admin/aura/costs", label: "Costs" },
  { href: "/admin/aura/conformance", label: "Conformance" },
];

export default async function AdminAuraPage() {
  await requirePermission("admin:dashboard");
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">AURA administration</h1>
      <AuraDisclaimerBanner scope="admin" />
      <p className="text-sm">
        Production activation of a specific agent, model, prompt, tool, MCP
        server, or A2A peer is a human administrator action. AURA cannot flip
        <code className="mx-1 rounded bg-neutral-100 px-1 text-xs">productionActivated=true</code>
        for any of these entities.
      </p>
      <nav aria-label="Admin AURA sections">
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="block rounded border p-3 text-sm hover:bg-neutral-50">
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
