import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listAssuranceFrameworks,
  seedAssuranceFrameworks,
} from "@/lib/assurance/frameworks/framework-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const frameworks = await listAssuranceFrameworks();
  return jsonOk(
    { frameworks, disclaimer: "Framework list is readiness tracking — not certification." },
    200
  );
}

export async function POST() {
  const user = await requireApiPermission("assurance:manage");
  if (user instanceof Response) return user;
  const result = await seedAssuranceFrameworks({ ownerUserId: user.id });
  return jsonOk(result);
}
