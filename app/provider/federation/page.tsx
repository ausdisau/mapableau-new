import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProviderFederationPage() {
  await requirePermission("provider:federation:read");
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Provider federation</h1>
        <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
          Federation is not participant data access. To read participant data
          you still need a directive and to go through the disclosure gateway.
        </p>
      </header>
      <nav aria-label="Provider federation" className="grid grid-cols-2 gap-3">
        {[
          ["Issuer", "/provider/federation/issuer"],
          ["Verifier", "/provider/federation/verifier"],
          ["Requests", "/provider/federation/requests"],
          ["Presentations", "/provider/federation/presentations"],
          ["Disclosures", "/provider/federation/disclosures"],
          ["Delegations", "/provider/federation/delegations"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="rounded border p-3 text-sm underline">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
