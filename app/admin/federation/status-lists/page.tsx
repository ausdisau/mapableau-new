import { requireAdminScope } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFederationStatusListsPage() {
  await requireAdminScope("credential:statuslist:manage");
  const lists = await prisma.credentialStatusList.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Status lists</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        Status lists are private by default. Publishing a public URL leaks a
        correlatable identifier and requires an explicit privacy assessment.
      </p>
      {lists.length === 0 ? (
        <p className="text-sm">No status lists yet.</p>
      ) : (
        <ul className="space-y-2">
          {lists.map((l) => (
            <li key={l.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{l.listKey}</div>
              <div>Purpose: {l.purpose}</div>
              <div>Size: {l.size}</div>
              <div>Private only: {l.privateOnly ? "yes" : "no"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
