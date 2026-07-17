import {
  GovernanceAdminBoundary,
  ShellFormNotice,
} from "@/app/admin/governance/_components";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminAppeals } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function AdminGovernanceAppealsPage() {
  await requirePermission("governance:appeal:read");
  const appeals = await listAdminAppeals({ nationalScope: true });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Appeals administration
        </h1>
        <p className="text-sm text-muted-foreground">
          Independent review, conflict recusal, decisions and remedies.
        </p>
      </header>
      <GovernanceAdminBoundary />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="font-semibold">Assign reviewer</h2>
          <ShellFormNotice endpoint="/api/admin/governance/appeals/{id}/assign" />
          <form className="mt-3 space-y-3 text-sm">
            <input
              className="w-full rounded border p-2"
              name="appealId"
              placeholder="Appeal ID"
            />
            <input
              className="w-full rounded border p-2"
              name="reviewerUserId"
              placeholder="Reviewer user ID"
            />
          </form>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold">Record decision</h2>
          <ShellFormNotice endpoint="/api/admin/governance/appeals/{id}/decide" />
          <form className="mt-3 space-y-3 text-sm">
            <input
              className="w-full rounded border p-2"
              name="finding"
              placeholder="Finding"
            />
            <input
              className="w-full rounded border p-2"
              name="outcome"
              placeholder="uphold | overturn | vary | remit"
            />
          </form>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Appeals</h2>
        {appeals.length === 0 ? (
          <p className="rounded border border-dashed p-4 text-sm">
            No appeals yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {appeals.map((appeal) => (
              <li key={appeal.id} className="rounded border p-4 text-sm">
                <p className="font-semibold">{appeal.decision.title}</p>
                <p>
                  {appeal.status} · service continued:{" "}
                  {appeal.serviceAccessContinued ? "yes" : "no"}
                </p>
                <p className="text-muted-foreground">
                  Review: {appeal.latestReview?.id ?? "not assigned"} ·
                  Remedies: {appeal.remedies.length}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
