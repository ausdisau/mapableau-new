import { PlatformGapDashboard } from "@/components/admin/PlatformGapDashboard";
import { requireAdmin } from "@/lib/auth/guards";
import { getPlatformGapAnalysisSummary } from "@/lib/platform-gaps/platform-gap-service";

export default async function PlatformGapsPage() {
  await requireAdmin();
  const summary = await getPlatformGapAnalysisSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Platform gap analysis</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Unified view of product, integration, launch, tenancy, and compliance gaps.
          Detected status is recomputed on each load; manual overrides persist for triage
          and accepted-risk decisions. For launch gates and scope, see the{" "}
          <a
            href="/docs/full-public-launch.md"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            full public launch guide
          </a>
          .
        </p>
      </div>
      <PlatformGapDashboard initialSummary={summary} />
    </div>
  );
}
