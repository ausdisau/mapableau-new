import Link from "next/link";

import { AuraDisclaimerBanner } from "@/components/aura/AuraDisclaimerBanner";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/provider/aura/tasks", label: "AURA tasks awaiting my team" },
  { href: "/provider/aura/approvals", label: "Approvals" },
  { href: "/provider/aura/handoffs", label: "Handoffs" },
  { href: "/provider/aura/exceptions", label: "Exceptions" },
  { href: "/provider/aura/incidents", label: "Incident candidates" },
];

export default async function ProviderAuraPage() {
  await requirePermission("admin:command-centre:read");
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">AURA for providers</h1>
      <AuraDisclaimerBanner scope="provider" />
      <p className="text-sm">
        Every AURA suggestion still needs a human decision. Billing specialist
        is explain-only; it can never approve invoices, claims, or payments.
      </p>
      <nav aria-label="Provider AURA sections">
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
