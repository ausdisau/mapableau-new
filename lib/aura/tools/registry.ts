import type { AuraActionRiskTier, AuraToolKind } from "@prisma/client";

/**
 * Tool registry. A tool MUST be in the registry to be plannable. AURA never
 * allows raw Prisma queries, raw shell, or arbitrary HTTP fetch as tools —
 * every capability must be a declared tool with schema-validated inputs and
 * outputs.
 */

export interface RegisteredTool {
  id: string;
  slug: string;
  displayName: string;
  kind: AuraToolKind;
  status: "draft" | "active" | "suspended" | "retired";
  versionKey: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  riskTier: AuraActionRiskTier;
  writeCapable: boolean;
  requiresConsent: boolean;
  externalEndpoint: string | null;
}

/** Tool slugs we refuse to register no matter what. */
export const PROHIBITED_TOOL_SLUGS = [
  "raw_prisma_query",
  "raw_sql",
  "raw_shell",
  "arbitrary_http_fetch",
  "eval_javascript",
  "modify_authority_envelope",
  "modify_consent_directive",
  "release_kill_switch",
  "activate_production_integration",
] as const;

export function isProhibitedToolSlug(slug: string): boolean {
  return (PROHIBITED_TOOL_SLUGS as readonly string[]).includes(slug);
}

export function assertToolIsUsable(tool: RegisteredTool | null): void {
  if (!tool) {
    throw new Error("TOOL_NOT_REGISTERED");
  }
  if (tool.status !== "active") {
    throw new Error(`TOOL_NOT_ACTIVE:${tool.status}`);
  }
  if (isProhibitedToolSlug(tool.slug)) {
    throw new Error("TOOL_PROHIBITED");
  }
}

/**
 * Very small runtime schema validator for a JSON-Schema-ish shape. Enough to
 * catch missing required keys and wrong scalar types; a full validator is out
 * of scope for the initial AURA landing.
 */
export function validateAgainstSchema(
  schema: Record<string, unknown>,
  value: unknown
): { ok: true } | { ok: false; error: string } {
  if (!schema || typeof schema !== "object") return { ok: true };
  const type = (schema as { type?: string }).type;
  if (type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { ok: false, error: "expected object" };
    }
    const required = ((schema as { required?: string[] }).required ?? []);
    for (const key of required) {
      if (!(key in (value as Record<string, unknown>))) {
        return { ok: false, error: `missing required key '${key}'` };
      }
    }
    return { ok: true };
  }
  if (type === "array") {
    if (!Array.isArray(value)) {
      return { ok: false, error: "expected array" };
    }
    return { ok: true };
  }
  if (type === "string") {
    if (typeof value !== "string") return { ok: false, error: "expected string" };
    return { ok: true };
  }
  if (type === "number" || type === "integer") {
    if (typeof value !== "number") return { ok: false, error: "expected number" };
    return { ok: true };
  }
  if (type === "boolean") {
    if (typeof value !== "boolean")
      return { ok: false, error: "expected boolean" };
    return { ok: true };
  }
  return { ok: true };
}
