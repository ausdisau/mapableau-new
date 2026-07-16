/**
 * Minimal Access Intelligence HTTP client for partner sandbox.
 */

export type AccessClientOptions = {
  baseUrl: string;
  apiKey?: string;
};

export function createAccessClient(options: AccessClientOptions) {
  async function getWidgetSummary(accessPlaceId: string) {
    const url = new URL("/api/access-intelligence/widget/summary", options.baseUrl);
    url.searchParams.set("accessPlaceId", accessPlaceId);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Widget summary failed: ${res.status}`);
    return res.json();
  }

  return { getWidgetSummary };
}
