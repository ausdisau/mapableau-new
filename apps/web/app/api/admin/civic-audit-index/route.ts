import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedCivicAudits,
  publishCivicAuditIndex,
} from "@/lib/civic-audit-index/audit-index-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ audits: await listPublishedCivicAudits() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const audit = await publishCivicAuditIndex(body);
  return jsonOk({ audit }, 201);
}
