import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CommunityMembershipAdminPage() {
  await requireAdmin();
  const members = await prisma.communityGovernanceMembership.findMany({
    orderBy: { joinedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Community membership</h1>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="rounded border p-3 text-sm">
            {m.memberLabel} — {m.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
