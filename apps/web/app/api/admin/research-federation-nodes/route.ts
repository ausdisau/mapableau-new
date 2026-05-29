import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  approveFederationNode,
  listFederationNodes,
  registerFederationNode,
} from "@/lib/research-federation-at-scale/federation-node-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await listFederationNodes());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.nodeId) {
    const node = await approveFederationNode(body.nodeId);
    return jsonOk({ node });
  }
  const node = await registerFederationNode(body);
  return jsonOk({ node }, 201);
}
