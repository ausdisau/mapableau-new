import {
  GovernanceAdminBoundary,
  ShellFormNotice,
} from "@/app/admin/governance/_components";
import { requirePermission } from "@/lib/auth/guards";
import { listPublicCommunityRecommendations } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function AdminGovernanceCommunityPage() {
  await requirePermission("governance:community:respond");
  const recommendations = await listPublicCommunityRecommendations();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Community oversight admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Respond to submitted community recommendations without converting them
          into binding decisions by default.
        </p>
      </header>
      <GovernanceAdminBoundary />
      <section className="rounded border p-4">
        <h2 className="font-semibold">Respond to recommendation</h2>
        <ShellFormNotice endpoint="/api/admin/governance/community/{id}/respond" />
        <form className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <input
            className="rounded border p-2"
            name="recommendationId"
            placeholder="Recommendation ID"
          />
          <input
            className="rounded border p-2"
            name="responseBody"
            placeholder="Response summary"
          />
        </form>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Submitted recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="rounded border border-dashed p-4 text-sm">
            No recommendations yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((recommendation) => (
              <li
                key={recommendation.id}
                className="rounded border p-4 text-sm"
              >
                <p className="font-semibold">{recommendation.title}</p>
                <p>{recommendation.recommendation}</p>
                <p className="text-muted-foreground">
                  {recommendation.advisoryByDefault
                    ? "Advisory"
                    : "Potentially binding"}{" "}
                  ·{" "}
                  {recommendation.latestResponse
                    ? "responded"
                    : "awaiting response"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
