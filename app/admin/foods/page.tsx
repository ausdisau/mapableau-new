import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function AdminFoodsPage() {
  await requirePermission("foods:admin");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Foods administration</h1>
      <ul className="list-disc pl-6">
        <li>
          <Link href="/admin/foods/vendors">Vendors</Link>
        </li>
        <li>
          <Link href="/admin/foods/orders">Orders</Link>
        </li>
        <li>
          <Link href="/admin/foods/disputes">Disputes</Link>
        </li>
        <li>
          <Link href="/admin/foods/food-safety">Food safety</Link>
        </li>
      </ul>
    </div>
  );
}
