import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminFoodVendorsPage() {
  await requirePermission("foods:admin");
  const vendors = await prisma.foodVendor.findMany({
    include: { organisation: { select: { name: true } } },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Food vendors</h1>
      <ul className="mt-4 space-y-2">
        {vendors.map((v) => (
          <li key={v.id} className="rounded border p-3">
            {v.displayName} — {v.organisation.name} — {v.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
