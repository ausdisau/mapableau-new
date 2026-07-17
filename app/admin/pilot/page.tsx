import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export default async function AdminPilotListPage() {
  const user = await requirePermission("pilot:view");
  const orgIds = isAdminRole(user.primaryRole)
    ? null
    : await getUserOrganisationIds(user.id);

  const pilots = await prisma.controlledPilot.findMany({
    where: orgIds ? { organisationId: { in: orgIds } } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          Controlled pilots (Wave 7)
        </h1>
        <p className="max-w-3xl text-sm">
          Organisation-scoped NDIS controlled pilot operations. Pilot approval
          is not production approval. Empty allowlists deny all. Limited live
          is off by default. There is no Submit to NDIA action here.
        </p>
      </header>

      {pilots.length === 0 ? (
        <p>No controlled pilots yet. Create one via the admin pilots API.</p>
      ) : (
        <ul className="space-y-3">
          {pilots.map((p) => {
            const envLabel =
              p.stage === "limited_live" || p.stage === "controlled_live"
                ? "Limited live"
                : "Sandbox / non-live";
            return (
              <li key={p.id} className="rounded border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/admin/pilot/${p.id}`}
                    className="font-medium underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-sm">
                    Status: {p.status.replace(/_/g, " ")} · Stage:{" "}
                    {p.stage.replace(/_/g, " ")} · Environment: {envLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  Code: {p.code}
                  {p.limitedLiveEnabled
                    ? " · Limited live flag: enabled"
                    : " · Limited live flag: disabled"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
