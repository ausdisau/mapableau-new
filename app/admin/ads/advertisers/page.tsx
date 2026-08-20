import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsAdvertisersPage() {
  await requireAdmin();

  const advertisers = await prisma.adAdvertiser
    .findMany({ orderBy: { name: "asc" }, take: 100 })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <Link href="/admin/ads" className="text-sm text-primary underline">
        ← Ads ops
      </Link>
      <h1 className="text-2xl font-bold">Advertisers</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th>Status</th>
            <th>Organisation</th>
          </tr>
        </thead>
        <tbody>
          {advertisers.map((a) => (
            <tr key={a.id} className="border-b border-border/60">
              <td className="py-2">{a.name}</td>
              <td>{a.status}</td>
              <td>{a.organisationId ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {advertisers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No advertisers yet. Run synthetic seed or create via API.
        </p>
      ) : null}
    </div>
  );
}
