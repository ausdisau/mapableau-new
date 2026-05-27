import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listPrivacyBreaches } from "@/lib/privacy/breach-register-service";

export const metadata = { title: "Privacy breaches | Admin" };

export default async function PrivacyBreachesPage() {
  await requirePermission("privacy:breach:manage");
  const breaches = await listPrivacyBreaches();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Privacy breach register</h1>
          <p className="mt-1 text-muted-foreground">
            Data breach readiness and notifiable incident tracking.
          </p>
        </div>
      </header>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Privacy breach records</caption>
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Title
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Discovered
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Affected
              </th>
            </tr>
          </thead>
          <tbody>
            {breaches.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                  No breach records. Create via API POST /api/admin/privacy/breaches.
                </td>
              </tr>
            ) : (
              breaches.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3">{b.title}</td>
                  <td className="px-4 py-3">{b.status}</td>
                  <td className="px-4 py-3">
                    {new Date(b.discoveredAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{b._count.affectedPeople}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        Use the{" "}
        <Link href="/admin/audit" className="underline">
          audit explorer
        </Link>{" "}
        for related security events.
      </p>
    </div>
  );
}
