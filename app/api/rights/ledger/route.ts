import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isRightsLedgerEnabled, isRightsOsEnabled } from "@/lib/rights-os/config";
import {
  generateLedgerManifest,
  getActiveAccess,
  getRightsHistory,
  revokeLease,
} from "@/lib/rights-os/ledger/ledger-service";

export async function GET() {
  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return jsonError("Rights ledger is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const history = await getRightsHistory(user.id);
  return jsonOk(history);
}

export async function POST() {
  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return jsonError("Rights ledger is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const result = await generateLedgerManifest(user.id);
  return jsonOk(result, 201);
}
