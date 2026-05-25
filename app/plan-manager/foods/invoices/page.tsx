import { FoodInvoicePanel } from "@/components/foods/FoodsOperations";
import { requirePermission } from "@/lib/auth/guards";

export default async function PlanManagerFoodInvoicesPage() { await requirePermission("foods:invoice:read"); return <main id="main-content" className="mx-auto max-w-5xl px-4 py-8"><FoodInvoicePanel /></main>; }