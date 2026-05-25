import {
  DEFAULT_FETCH_USER_AGENT,
  NDIS_LIST_PROVIDERS_URL,
} from "@/lib/ndis-provider-ingest/constants";

export type DownloadResult =
  | { ok: true; body: string; source: "url" | "file" }
  | { ok: false; error: string; hint?: string };

export async function downloadNdisListProviders(
  url = NDIS_LIST_PROVIDERS_URL,
): Promise<DownloadResult> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": DEFAULT_FETCH_USER_AGENT,
      },
      redirect: "follow",
    });
    const body = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status} ${res.statusText}`,
        hint:
          "NDIS may block automated downloads. Save the file manually and run: pnpm ingest:ndis-providers --input path/to/list-providers.json",
      };
    }
    if (body.trimStart().startsWith("<!DOCTYPE") || body.includes("<html")) {
      return {
        ok: false,
        error: "Response is HTML (likely a bot challenge), not JSON",
        hint:
          "Download list-providers.json in a browser from the NDIS provider finder, then: pnpm ingest:ndis-providers --input ./list-providers.json",
      };
    }
    return { ok: true, body, source: "url" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Download failed",
      hint:
        "Use --input with a local copy of list-providers.json from the NDIS site.",
    };
  }
}
