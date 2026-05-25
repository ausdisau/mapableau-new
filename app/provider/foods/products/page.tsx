import Link from "next/link";

import { getVendorIdForUser } from "@/lib/foods/access-control";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderFoodProductsPage() {
  const user = await requirePermission("foods:read:org");
  const vendorId = await getVendorIdForUser(user.id);
  const products = vendorId
    ? await prisma.foodProduct.findMany({
        where: { vendorId },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/provider/foods/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New product
        </Link>
      </div>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/provider/foods/products/${p.id}/edit`} className="block rounded border p-3">
              {p.title} — {p.status} — ${(p.priceAmount / 100).toFixed(2)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
