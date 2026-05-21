import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  approveFederatedAgreement,
  createFederatedAgreement,
  listFederatedAgreements,
} from "@/lib/federated-research/federation-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await listFederatedAgreements());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.agreementId) {
    const agreement = await approveFederatedAgreement(body.agreementId);
    return jsonOk({ agreement });
  }
  const agreement = await createFederatedAgreement(body);
  return jsonOk({ agreement }, 201);
}
