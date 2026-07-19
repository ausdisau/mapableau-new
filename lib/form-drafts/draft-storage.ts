import { z } from "zod";

import { accessIndependenceConfig } from "@/lib/config/access-independence";

export const FORM_DRAFT_SCHEMA_VERSION = 1;

export type DraftStorageClass =
  | "safe_local"
  | "account_only"
  | "never_draft";

/** Schema-specific allowlists — never a blacklist. */
export const CARE_REQUEST_LOCAL_ALLOWLIST = [
  "requestType",
  "shareAccessibility",
  "linkedTransport",
  "stepId",
] as const;

export const BARRIER_REPORT_LOCAL_ALLOWLIST = [
  "category",
  "urgency",
  "placeSlug",
  "placeName",
  "anonymous",
  "stepId",
] as const;

const SENSITIVE_KEY_PATTERN =
  /(password|token|card|cvv|ssn|medicare|ndis|address|description|accesssummary|task|diagnos|contact|phone|email|document|image|note)/i;

export const localFormDraftSchema = z.object({
  version: z.literal(1),
  workflowKey: z.string().min(1).max(120),
  stepId: z.string().max(120).nullable(),
  payload: z.record(z.string(), z.unknown()),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type LocalFormDraft = z.infer<typeof localFormDraftSchema>;

const STORAGE_PREFIX = "mapable:form-draft:v1:";

export function localDraftKey(workflowKey: string): string {
  return `${STORAGE_PREFIX}${workflowKey}`;
}

function allowlistForWorkflow(workflowKey: string): readonly string[] | null {
  if (workflowKey === "care-request-wizard") return CARE_REQUEST_LOCAL_ALLOWLIST;
  if (workflowKey === "access-barrier-report") {
    return BARRIER_REPORT_LOCAL_ALLOWLIST;
  }
  return null;
}

function scrubValue(key: string, value: unknown, depth: number): unknown {
  if (depth > 4) return undefined;
  if (SENSITIVE_KEY_PATTERN.test(key)) return undefined;
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 200) return value.slice(0, 200);
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    // Nested free-text arrays (tasks) are not safe locally.
    return undefined;
  }
  if (typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const scrubbed = scrubValue(childKey, childValue, depth + 1);
      if (scrubbed !== undefined) next[childKey] = scrubbed;
    }
    return next;
  }
  return undefined;
}

/**
 * Sanitise inside local storage — callers cannot bypass allowlists.
 * Sensitive free text never reaches localStorage by default.
 */
export function sanitizeLocalDraftPayload(
  workflowKey: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const allow = allowlistForWorkflow(workflowKey);
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (allow && !allow.includes(key)) continue;
    if (!allow && SENSITIVE_KEY_PATTERN.test(key)) continue;
    const scrubbed = scrubValue(key, value, 0);
    if (scrubbed !== undefined) next[key] = scrubbed;
  }
  return next;
}

const NEVER_DRAFT_KEY_PATTERN =
  /(password|token|card|cvv|ssn|medicare|secret|rawImage|fileBytes)/i;

/**
 * Account drafts may keep user-authored care text for the authenticated owner only.
 * Still reject secrets, credentials and oversized nested blobs.
 */
export function sanitizeAccountDraftPayload(
  payload: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth > 6) return {};
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (NEVER_DRAFT_KEY_PATTERN.test(key)) continue;
    if (value == null) {
      next[key] = value;
      continue;
    }
    if (typeof value === "string") {
      next[key] = value.length > 8000 ? value.slice(0, 8000) : value;
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      next[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      next[key] = value.slice(0, 50).map((item) => {
        if (item == null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          return typeof item === "string" && item.length > 2000
            ? item.slice(0, 2000)
            : item;
        }
        if (typeof item === "object") {
          return sanitizeAccountDraftPayload(
            item as Record<string, unknown>,
            depth + 1,
          );
        }
        return null;
      });
      continue;
    }
    if (typeof value === "object") {
      next[key] = sanitizeAccountDraftPayload(
        value as Record<string, unknown>,
        depth + 1,
      );
    }
  }
  return next;
}

export function loadLocalDraft(workflowKey: string): LocalFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localDraftKey(workflowKey));
    if (!raw) return null;
    if (raw.length > accessIndependenceConfig.localDraftMaxBytes) {
      window.localStorage.removeItem(localDraftKey(workflowKey));
      return null;
    }
    const parsed = localFormDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      window.localStorage.removeItem(localDraftKey(workflowKey));
      return null;
    }
    if (parsed.data.version !== FORM_DRAFT_SCHEMA_VERSION) {
      window.localStorage.removeItem(localDraftKey(workflowKey));
      return null;
    }
    if (new Date(parsed.data.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(localDraftKey(workflowKey));
      return null;
    }
    return {
      ...parsed.data,
      payload: sanitizeLocalDraftPayload(workflowKey, parsed.data.payload),
    };
  } catch {
    return null;
  }
}

export function saveLocalDraft(draft: {
  workflowKey: string;
  stepId: string | null;
  payload: Record<string, unknown>;
  expiresAt?: string;
  ttlDays?: number;
}): LocalFormDraft {
  const ttlDays = draft.ttlDays ?? 14;
  // Reject oversized inputs before scrubbing (callers must not dump large blobs).
  if (
    JSON.stringify(draft.payload).length >
    accessIndependenceConfig.localDraftMaxBytes
  ) {
    throw new Error("DRAFT_TOO_LARGE");
  }
  const payload = sanitizeLocalDraftPayload(draft.workflowKey, draft.payload);
  const next: LocalFormDraft = {
    version: 1,
    workflowKey: draft.workflowKey,
    stepId: draft.stepId,
    payload,
    updatedAt: new Date().toISOString(),
    expiresAt:
      draft.expiresAt ??
      new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString(),
  };

  const serialized = JSON.stringify(next);
  if (serialized.length > accessIndependenceConfig.localDraftMaxBytes) {
    throw new Error("DRAFT_TOO_LARGE");
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(localDraftKey(draft.workflowKey), serialized);
    } catch {
      // Quota / private mode — fail closed silently for UX; callers may use account drafts.
    }
  }
  return next;
}

export function clearLocalDraft(workflowKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(localDraftKey(workflowKey));
  } catch {
    // ignore
  }
}
