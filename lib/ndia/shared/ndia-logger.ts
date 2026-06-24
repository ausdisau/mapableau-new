type NdiaLogMeta = Record<string, unknown>;

const NDIS_NUMBER_PATTERN = /\b\d{9}\b/g;

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(NDIS_NUMBER_PATTERN, "****NDIS");
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (/secret|token|password|authorization/i.test(key)) {
        out[key] = "[redacted]";
      } else if (/ndis/i.test(key) && typeof nested === "string") {
        out[key] = "****";
      } else {
        out[key] = redactValue(nested);
      }
    }
    return out;
  }
  return value;
}

export function logNdiaEvent(
  action: string,
  meta?: NdiaLogMeta,
  level: "info" | "warn" | "error" = "info"
) {
  const payload = {
    scope: "ndia",
    action,
    at: new Date().toISOString(),
    ...(meta ? { meta: redactValue(meta) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
