import Link from "next/link";

import { LaunchReadinessDashboard } from "@/components/admin/LaunchReadinessDashboard";
import { requireAdmin } from "@/lib/auth/guards";
import { getLaunchReadinessSummary } from "@/lib/launch-readiness/launch-readiness-service";

export default async function LaunchReadinessPage() {
  await requireAdmin();
  const summary = await getLaunchReadinessSummary();

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <Link
          href="/admin/readiness"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Readiness command center
        </Link>
        {" · "}
        <Link
          href="/docs/full-public-launch.md"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Full public launch guide
        </Link>
        {" · "}
        <Link
          href="/admin/platform-gaps"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Platform gap analysis
        </Link>
      </p>

      <h1 className="font-heading text-2xl font-bold">Production launch readiness</h1>

      <LaunchReadinessDashboard initialSummary={summary} />
    </div>
  );
}
