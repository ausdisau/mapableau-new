import { jsonError } from "@/lib/api/response";

import { StorageError } from "./errors";

export function storageErrorResponse(err: unknown): Response {
  if (err instanceof StorageError) {
    return jsonError(err.message, err.status);
  }
  return jsonError("Storage request failed", 500);
}
