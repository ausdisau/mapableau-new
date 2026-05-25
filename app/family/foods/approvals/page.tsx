import { requirePermission } from "@/lib/auth/guards";

export default async function FamilyFoodApprovalsPage() {
  await requirePermission("foods:approve:nominee");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Food order approvals</h1>
      <p className="mt-2 text-muted-foreground">
        Approve nominee-placed orders when you have permission. Orders awaiting your approval will
        appear here.
      </p>
    </div>
  );
}
