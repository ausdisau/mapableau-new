import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AlgorithmRegisterAdminPage() {
  await requireAdmin();
  const algorithms = await prisma.registeredAlgorithm.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Algorithm register</h1>
      <ul className="space-y-2">
        {algorithms.map((a) => (
          <li key={a.id} className="rounded border p-3">
            {a.name} v{a.version} ({a.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
