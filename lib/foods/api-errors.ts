import { ZodError } from "zod";

import { jsonError, zodErrorResponse } from "@/lib/api/response";

import { FoodAccessError } from "./access-control";

export function foodErrorResponse(error: unknown) {
  if (error instanceof ZodError) return zodErrorResponse(error);
  if (error instanceof FoodAccessError) {
    return jsonError(error.code === "NOT_FOUND" ? "Not found" : "Forbidden", error.code === "NOT_FOUND" ? 404 : 403);
  }
  if (error instanceof Error) {
    if (error.message === "NOT_FOUND") return jsonError("Not found", 404);
    if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (
      [
        "INVALID_STATUS",
        "INVALID_DELIVERY_WINDOW",
        "ALLERGEN_ACK_REQUIRED",
        "PAYMENT_BLOCKED",
        "PAYMENT_ALREADY_STARTED",
        "INVOICE_BLOCKED",
      ].includes(error.message)
    ) {
      return jsonError(error.message, 409);
    }
    return jsonError(error.message, 400);
  }
  return jsonError("Food request failed", 500);
}
