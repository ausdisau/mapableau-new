import { FamilyFoodApprovals } from "@/components/foods/FoodsOperations";
import { requirePermission } from "@/lib/auth/guards";

export default async function FamilyFoodApprovalsPage() { await requirePermission("foods:approve:nominee"); return <main id="main-content" className="mx-auto max-w-5xl px-4 py-8"><FamilyFoodApprovals /></main>; }