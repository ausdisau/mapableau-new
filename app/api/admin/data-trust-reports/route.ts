import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedAnnualReports,
  publishDataTrustAnnualReport,
} from "@/lib/data-trust-annual-report/annual-report-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ reports: await listPublishedAnnualReports() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const report = await publishDataTrustAnnualReport({
    yearLabel: body.yearLabel,
    title: body.title,
    summary: body.summary,
    report: body.report ?? {},
  });
  return jsonOk({ report }, 201);
}
