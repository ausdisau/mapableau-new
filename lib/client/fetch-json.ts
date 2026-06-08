export type FetchJsonResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; data?: unknown };

export async function fetchJson<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  try {
    const res = await fetch(input, init);
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : `Request failed (${res.status})`;
      return { ok: false, error: message, status: res.status, data };
    }

    return { ok: true, data: data as T, status: res.status };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again.", status: 0 };
  }
}
