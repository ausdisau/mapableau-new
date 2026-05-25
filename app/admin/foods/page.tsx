import { AdminFoodsDashboard } from "@/components/foods/FoodsOperations";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminFoodsPage() { await requirePermission("foods:admin"); return <main id="main-content" className="mx-auto max-w-6xl px-4 py-8"><AdminFoodsDashboard /></main>; }