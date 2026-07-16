/**
 * Minimal Access Intelligence HTTP client for partner sandbox.
 */

export type AccessClientOptions = {
  baseUrl: string;
  apiKey?: string;
};

export function createAccessClient(options: AccessClientOptions) {
  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { Accept: "application/json" };
    if (options.apiKey) h.Authorization = `Bearer ${options.apiKey}`;
    return h;
  };

  async function getWidgetSummary(
    accessPlaceId: string,
    opts?: { placeName?: string; certify?: boolean },
  ) {
    const url = new URL(
      "/api/access-intelligence/widget/summary",
      options.baseUrl,
    );
    url.searchParams.set("accessPlaceId", accessPlaceId);
    if (opts?.placeName) url.searchParams.set("placeName", opts.placeName);
    if (opts?.certify) url.searchParams.set("certify", "1");
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`Widget summary failed: ${res.status}`);
    return res.json();
  }

  async function runCertification(accessPlaceId: string) {
    return getWidgetSummary(accessPlaceId, { certify: true });
  }

  return { getWidgetSummary, runCertification };
}
