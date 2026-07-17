import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  createOfflineDisclosureDraft,
  describeOfflineRights,
  listOfflineDisclosureDrafts,
} from "@/lib/vault/offline";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  try {
    return vaultOk({
      rights: describeOfflineRights(),
      drafts: listOfflineDisclosureDrafts(user.id),
    });
  } catch (error) {
    return vaultErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const draft = createOfflineDisclosureDraft({
      ownerUserId: user.id,
      purposeCode: body.purposeCode,
      requestedFields: body.requestedFields ?? [],
    });
    return vaultOk({ draft }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
