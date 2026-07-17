import Link from "next/link";

import { AuraDisclaimerBanner } from "@/components/aura/AuraDisclaimerBanner";
import { auraConfig } from "@/lib/aura/config";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/participant/aura/goals", label: "My goals" },
  { href: "/participant/aura/plans", label: "Plans awaiting me" },
  { href: "/participant/aura/approvals", label: "Approvals to review" },
  { href: "/participant/aura/executions", label: "In-flight and past executions" },
  { href: "/participant/aura/history", label: "History" },
  { href: "/participant/aura/memory", label: "Memory AURA knows about me" },
  { href: "/participant/aura/permissions", label: "AURA permissions I have granted" },
  { href: "/participant/aura/specialists", label: "Specialist agents I use" },
  { href: "/participant/aura/settings", label: "Settings" },
  { href: "/participant/aura/safety", label: "Pause AURA / safety" },
  { href: "/participant/aura/feedback", label: "Feedback on AURA" },
];

export default async function ParticipantAuraPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">AURA</h1>
        <p className="text-sm text-muted-foreground">
          Automated Utility & Reasoning Assistant. This is a bounded assistant
          you control.
        </p>
        <AuraDisclaimerBanner scope="participant" />
      </header>

      {!auraConfig.enabled && (
        <div
          role="status"
          aria-label="AURA is currently off"
          className="rounded border border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm"
        >
          AURA is not currently enabled on this environment. Nothing acts on
          your behalf until you invite it explicitly.
        </div>
      )}

      <nav aria-label="AURA sections">
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block rounded border p-3 text-sm hover:bg-neutral-50 focus:outline focus:outline-2"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
