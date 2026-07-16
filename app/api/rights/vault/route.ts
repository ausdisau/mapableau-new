import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isPersonalVaultEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import {
  addVaultItem,
  exportVaultPackage,
  getOrCreateVault,
  registerVaultDevice,
  revokeVaultDevice,
} from "@/lib/rights-os/vault/vault-service";

export async function GET() {
  if (!isRightsOsEnabled() || !isPersonalVaultEnabled()) {
    return jsonError("Personal Access Vault is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const vault = await getOrCreateVault(user.id);
  return jsonOk({
    vault: {
      id: vault.id,
      itemCount: vault.items.length,
      deviceCount: vault.devices.length,
      encryptionState: vault.encryptionState,
    },
    items: vault.items.map((item) => ({
      id: item.id,
      category: item.category,
      source: item.source,
      sensitivity: item.sensitivity,
      fields: item.fieldsJson,
      version: item.version,
      expiresAt: item.expiresAt,
    })),
    devices: vault.devices.map((d) => ({
      id: d.id,
      deviceLabel: d.deviceLabel,
      status: d.status,
      registeredAt: d.registeredAt,
    })),
  });
}

export async function POST(req: Request) {
  if (!isRightsOsEnabled() || !isPersonalVaultEnabled()) {
    return jsonError("Personal Access Vault is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await req.json()) as {
    action?: string;
    category?: string;
    source?: string;
    sensitivity?: string;
    fields?: string[];
    payload?: Record<string, unknown>;
    deviceLabel?: string;
    deviceId?: string;
  };

  if (body.action === "add_item") {
    const item = await addVaultItem({
      subjectUserId: user.id,
      category: body.category ?? "general",
      source: body.source ?? "participant",
      sensitivity: body.sensitivity ?? "participant_private",
      fields: body.fields ?? [],
      payload: body.payload,
    });
    return jsonOk({ item }, 201);
  }

  if (body.action === "register_device" && body.deviceLabel) {
    const device = await registerVaultDevice({
      subjectUserId: user.id,
      deviceLabel: body.deviceLabel,
    });
    return jsonOk({ device }, 201);
  }

  if (body.action === "revoke_device" && body.deviceId) {
    const device = await revokeVaultDevice(body.deviceId, user.id);
    return jsonOk({ device });
  }

  if (body.action === "export") {
    const result = await exportVaultPackage(user.id);
    return jsonOk(result, 201);
  }

  return jsonError("Invalid action", 400);
}
