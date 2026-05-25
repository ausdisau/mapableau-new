import { prisma } from "@/lib/prisma";

export default async function AdminPeerReportsPage() {
  const reports = await prisma.peerReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer reports</h1>
      <ul className="space-y-2 text-sm">
        {reports.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.reason} — {r.contentType} {r.contentId}
          </li>
        ))}
      </ul>
    </div>
  );
}
