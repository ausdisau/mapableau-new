import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listAnalyticsRuns,
  runPrivacyPreservingAnalytics,
} from "@/lib/privacy-preserving-analytics/analytics-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ runs: await listAnalyticsRuns() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const run = await runPrivacyPreservingAnalytics(
    body.runLabel ?? `run-${Date.now()}`
  );
  return jsonOk({ run }, 201);
}
