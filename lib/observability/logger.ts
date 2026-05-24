import { safeEnvSummary } from "@/lib/env";

export type LogFields = {
  request_id?: string;
  user_id_hash?: string;
  role?: string;
  route?: string;
  action?: string;
  status?: string | number;
  error_code?: string;
  duration_ms?: number;
};

function hashUserId(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h << 5) - h + userId.charCodeAt(i);
    h |= 0;
  }
  return `u_${Math.abs(h).toString(16)}`;
}

export function logInfo(message: string, fields: LogFields = {}) {
  const payload = {
    level: "info",
    message,
    ...fields,
    env: process.env.NODE_ENV,
  };
  console.info(JSON.stringify(payload));
}

export function logError(message: string, fields: LogFields = {}) {
  console.error(JSON.stringify({ level: "error", message, ...fields }));
}

export function logRequest(params: {
  requestId: string;
  route: string;
  userId?: string;
  role?: string;
  status: number;
  durationMs: number;
}) {
  logInfo("request_complete", {
    request_id: params.requestId,
    route: params.route,
    user_id_hash: params.userId ? hashUserId(params.userId) : undefined,
    role: params.role,
    status: params.status,
    duration_ms: params.durationMs,
  });
}

export function logStartup() {
  logInfo("app_env", { action: "startup", ...safeEnvSummary() });
}
