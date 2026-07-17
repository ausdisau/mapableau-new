import Link from "next/link";

import { requireAdminScope } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFederationPage() {
  await requireAdminScope("federation:read:any");
  const [entities, trust, schemas, statusLists] = await Promise.all([
    prisma.externalFederationEntity.count(),
    prisma.credentialTrustRegistryEntry.count(),
    prisma.credentialSchemaDefinition.count(),
    prisma.credentialStatusList.count(),
  ]);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Federation admin</h1>
        <p className="text-sm">
          Governance surface for external federation entities, trust registry,
          issuance schemas and status lists.
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt>External entities</dt>
        <dd>{entities}</dd>
        <dt>Trust registry entries</dt>
        <dd>{trust}</dd>
        <dt>Schemas</dt>
        <dd>{schemas}</dd>
        <dt>Status lists</dt>
        <dd>{statusLists}</dd>
      </dl>
      <nav aria-label="Federation admin sections" className="grid grid-cols-2 gap-3">
        {[
          ["Trust registry", "/admin/federation/trust-registry"],
          ["Issuers", "/admin/federation/issuers"],
          ["Verifiers", "/admin/federation/verifiers"],
          ["Schemas", "/admin/federation/schemas"],
          ["Status lists", "/admin/federation/status-lists"],
          ["Conformance", "/admin/federation/conformance"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="rounded border p-3 text-sm underline">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
