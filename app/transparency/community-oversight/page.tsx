import {
  EmptyState,
  TransparencyDisclaimer,
} from "@/app/transparency/_components";
import { listPublicCommunityRecommendations } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencyCommunityOversightPage() {
  const recommendations = await listPublicCommunityRecommendations();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Community oversight</h1>
        <p className="text-sm text-muted-foreground">
          Community panels can make recommendations and publish responses, but
          recommendations are advisory by default.
        </p>
      </header>
      <TransparencyDisclaimer />
      {recommendations.length === 0 ? (
        <EmptyState>
          No submitted community recommendations are currently public.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((recommendation) => (
            <li key={recommendation.id} className="rounded border p-4">
              <h2 className="font-semibold">{recommendation.title}</h2>
              <p className="mt-2 text-sm">{recommendation.recommendation}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {recommendation.advisoryByDefault
                  ? "Advisory by default"
                  : "Binding only under an approved instrument"}
              </p>
              {recommendation.latestResponse && (
                <div className="mt-3 rounded bg-neutral-50 p-3 text-sm">
                  <p className="font-medium">Response</p>
                  <p>{recommendation.latestResponse.responseBody}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
