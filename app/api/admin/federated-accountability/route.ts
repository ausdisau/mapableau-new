import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  linkAccountabilityPartner,
  listAccountabilityPartners,
} from "@/lib/federated-accountability/federation-partner-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ partners: await listAccountabilityPartners() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const partner = await linkAccountabilityPartner(body);
  return jsonOk({ partner }, 201);
}
