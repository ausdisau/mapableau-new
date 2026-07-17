import {
  AdminGovernanceNav,
  GovernanceAdminBoundary,
} from "@/app/admin/governance/_components";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminGovernancePage() {
  await requirePermission("governance:system:manage");

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Governance administration
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage governed systems, AIA readiness, independent appeals and
          community oversight responses.
        </p>
      </header>
      <GovernanceAdminBoundary />
      <AdminGovernanceNav />
    </main>
  );
}
