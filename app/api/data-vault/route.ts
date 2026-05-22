import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listVaultRequestsForUser,
  requestDataVaultExport,
} from "@/lib/personal-data-vault/vault-service";
import type { DataVaultRequestType } from "@prisma/client";

export async function GET() {
  const user = await requireApiPermission("data_vault:self");
  if (user instanceof Response) return user;
  const requests = await listVaultRequestsForUser(user.id);
  return jsonOk({ requests });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("data_vault:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const result = await requestDataVaultExport(
    user.id,
    (body.requestType ?? "export") as DataVaultRequestType
  );
  return jsonOk(result, 201);
}
