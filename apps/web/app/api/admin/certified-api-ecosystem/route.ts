import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  addEcosystemEntry,
  listCertifiedApiEcosystem,
} from "@/lib/certified-api-ecosystem/ecosystem-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await listCertifiedApiEcosystem());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const entry = await addEcosystemEntry(body);
  return jsonOk({ entry }, 201);
}
