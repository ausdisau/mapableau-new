import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  addVaultItem,
  attachVaultItemSchema,
  listVaultItems,
  VAULT_ITEM_KINDS,
  vaultErrorResponse,
  VaultError,
} from "@/lib/privacy/participant-vault";
import {
  guessDocumentMime,
  validateUpload,
} from "@/lib/storage/documents";
import { StorageError } from "@/lib/storage/errors";

export const dynamic = "force-dynamic";

const CLIENT_KEY_FIELDS = ["objectKey", "bucket", "fileKey", "storedAssetId"];

function rejectsClientStorageKeys(form: FormData): boolean {
  return CLIENT_KEY_FIELDS.some((field) => form.has(field));
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const result = await listVaultItems(user.id);
    return jsonOk(result);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const ip = getClientIp(req);
      if (
        !checkIpRateLimit(`vault-upload:${user.id}:${ip}`, {
          windowMs: 60_000,
          max: 10,
        })
      ) {
        return jsonError("Too many upload requests", 429);
      }

      const form = await req.formData();
      if (rejectsClientStorageKeys(form)) {
        return jsonError("Client cannot supply storage keys", 400);
      }
      const file = form.get("file");
      if (!(file instanceof File)) {
        return jsonError("file required");
      }
      const kindRaw = String(form.get("kind") ?? "");
      if (!(VAULT_ITEM_KINDS as readonly string[]).includes(kindRaw)) {
        return jsonError("Unknown vault item kind");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const validation = validateUpload(guessDocumentMime(file.name), buffer.length);
      if (validation) return jsonError(validation);

      const item = await addVaultItem({
        userId: user.id,
        kind: kindRaw as (typeof VAULT_ITEM_KINDS)[number],
        label: String(form.get("label") ?? "") || null,
        file: { buffer, originalName: file.name },
      });
      return jsonOk({ item }, 201);
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }
    const parsed = attachVaultItemSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const item = await addVaultItem({
      userId: user.id,
      kind: parsed.data.kind,
      label: parsed.data.label,
      documentId: parsed.data.documentId,
    });
    return jsonOk({ item }, 201);
  } catch (error) {
    if (error instanceof StorageError) {
      return jsonError(error.message, error.status);
    }
    if (error instanceof VaultError) {
      return vaultErrorResponse(error);
    }
    return vaultErrorResponse(error);
  }
}
