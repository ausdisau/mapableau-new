import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  confidentialComputeLabStatus,
  externalProviderLabStatus,
  privateMatchingLabStatus,
} from "@/lib/vault/lab";
import { vaultOk } from "@/lib/vault/http";

export async function GET() {
  const user = await requireApiPermission("vault:privacy_officer");
  if (user instanceof Response) return user;
  return vaultOk({
    privateMatching: privateMatchingLabStatus(),
    confidentialCompute: confidentialComputeLabStatus(),
    externalProvider: externalProviderLabStatus(),
  });
}
