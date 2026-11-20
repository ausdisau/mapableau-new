/**
 * Preserve in-progress form data across re-authentication (WCAG 2.2.5).
 * Drafts are scoped per key in sessionStorage (cleared on tab close).
 */

const PREFIX = "mapable:form-draft:";

export function saveFormDraft(
  key: string,
  values: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify({ savedAt: Date.now(), values }),
    );
  } catch {
    // quota / private mode — ignore
  }
}

export function loadFormDraft<T extends Record<string, unknown>>(
  key: string,
): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: T };
    return parsed.values ?? null;
  } catch {
    return null;
  }
}

export function clearFormDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // ignore
  }
}
