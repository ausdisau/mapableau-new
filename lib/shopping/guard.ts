import { jsonError } from "@/lib/api/response";
import { isShoppingEnabled } from "@/lib/config/shopping";

export function shoppingDisabledResponse() {
  return jsonError("MapAble Shopping is not available", 404);
}

export function requireShoppingEnabled(): Response | null {
  if (!isShoppingEnabled()) {
    return shoppingDisabledResponse();
  }
  return null;
}
