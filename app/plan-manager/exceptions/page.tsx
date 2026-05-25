import { requirePermission } from "@/lib/auth/guards";

export const metadata = { title: "Exceptions | Plan manager" };

export default async function PlanManagerExceptionsPage() {
  await requirePermission("plan_manager:portal");

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Exceptions</h1>
      <p className="text-sm text-muted-foreground">
        Claim validation warnings and invoice exceptions need your review.
      </p>
    </div>
  );
}
