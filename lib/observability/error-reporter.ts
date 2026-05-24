import { logError } from "@/lib/observability/logger";

export function reportError(
  error: unknown,
  context: {
    requestId?: string;
    route?: string;
    errorCode?: string;
  } = {}
) {
  const message = error instanceof Error ? error.message : String(error);
  logError(message, {
    request_id: context.requestId,
    route: context.route,
    error_code: context.errorCode ?? "INTERNAL_ERROR",
  });
}
