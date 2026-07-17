import { jsonError, jsonOk } from "@/lib/api/response";
import {
  VaultDisabledError,
  VaultForbiddenError,
} from "@/lib/vault/registry";

export function vaultErrorResponse(error: unknown) {
  if (error instanceof VaultDisabledError) {
    return jsonError(error.message, 404);
  }
  if (error instanceof VaultForbiddenError) {
    return jsonError(error.message, 403);
  }
  if (error instanceof Error) {
    return jsonError(error.message, 400);
  }
  return jsonError("VAULT_UNEXPECTED_ERROR", 500);
}

export function vaultOk<T>(data: T, status = 200) {
  return jsonOk(data, status);
}
