import { z } from "zod";

export const FORM_DRAFT_SCHEMA_VERSION = 1;

export const localFormDraftSchema = z.object({
  version: z.literal(1),
  workflowKey: z.string().min(1).max(120),
  stepId: z.string().max(120).nullable(),
  /** Non-sensitive answers only when stored locally. */
  payload: z.record(z.string(), z.unknown()),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type LocalFormDraft = z.infer<typeof localFormDraftSchema>;

const STORAGE_PREFIX = "mapable:form-draft:v1:";

export function localDraftKey(workflowKey: string): string {
  return `${STORAGE_PREFIX}${workflowKey}`;
}

export function loadLocalDraft(workflowKey: string): LocalFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localDraftKey(workflowKey));
    if (!raw) return null;
    const parsed = localFormDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (new Date(parsed.data.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(localDraftKey(workflowKey));
      return null;
    }
    return parsed.data;
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
  const next: LocalFormDraft = {
    version: 1,
    workflowKey: draft.workflowKey,
    stepId: draft.stepId,
    payload: draft.payload,
    updatedAt: new Date().toISOString(),
    expiresAt:
      draft.expiresAt ??
      new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        localDraftKey(draft.workflowKey),
        JSON.stringify(next),
      );
    } catch {
      // Quota / private mode
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

/** Strip fields that must never sit in localStorage. */
export function sanitizeLocalDraftPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const blocked = new Set([
    "password",
    "passwordConfirm",
    "cardNumber",
    "cvv",
    "ssn",
    "medicareNumber",
    "ndisNumber",
    "token",
    "accessToken",
  ]);
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (blocked.has(key)) continue;
    if (typeof value === "string" && value.length > 5000) {
      next[key] = value.slice(0, 5000);
      continue;
    }
    next[key] = value;
  }
  return next;
}
