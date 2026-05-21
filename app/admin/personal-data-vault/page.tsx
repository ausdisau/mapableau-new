import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PersonalDataVaultAdminPage() {
  await requireAdmin();
  const requests = await prisma.personalDataVaultRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Personal data vault</h1>
      <p className="text-muted-foreground">
        Review and complete vault requests — human sign-off required.
      </p>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            {r.requestType} — user {r.userId.slice(0, 8)} — {r.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
