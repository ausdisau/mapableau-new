import { PanoramaxError } from "./errors";
import { panoramaxApiRootSchema, panoramaxItemSchema } from "./schemas";

export type PanoramaxClientConfig = {
  baseUrl: string;
  allowedHosts: string[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function assertSafeBaseUrl(baseUrl: string, allowedHosts: string[]): URL {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new PanoramaxError("NOT_CONFIGURED", "Invalid Panoramax base URL", 500);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new PanoramaxError("SSRF_BLOCKED", "Unsupported URL protocol", 400);
  }
  if (
    allowedHosts.length > 0 &&
    !allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
  ) {
    throw new PanoramaxError("SSRF_BLOCKED", "Host not allowlisted", 400);
  }
  return url;
}

export function createPanoramaxClient(config: PanoramaxClientConfig) {
  const timeoutMs = config.timeoutMs ?? 8_000;
  const fetchImpl = config.fetchImpl ?? fetch;
  const base = assertSafeBaseUrl(config.baseUrl, config.allowedHosts);

  async function request(path: string): Promise<unknown> {
    const url = new URL(path, base);
    if (
      config.allowedHosts.length > 0 &&
      !config.allowedHosts.some(
        (host) =>
          url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    ) {
      throw new PanoramaxError("SSRF_BLOCKED", "Request host blocked", 400);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (response.status === 429) {
        throw new PanoramaxError("RATE_LIMITED", "Rate limited", 429);
      }
      if (!response.ok) {
        throw new PanoramaxError(
          "HTTP_ERROR",
          `Panoramax HTTP ${response.status}`,
          502,
        );
      }
      return await response.json();
    } catch (error) {
      if (error instanceof PanoramaxError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new PanoramaxError("TIMEOUT", "Request timed out", 504);
      }
      throw new PanoramaxError(
        "HTTP_ERROR",
        error instanceof Error ? error.message : "Request failed",
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async getApiRoot() {
      return panoramaxApiRootSchema.parse(await request("/api"));
    },
    async getItem(itemId: string) {
      return panoramaxItemSchema.parse(
        await request(`/api/collections/-/items/${encodeURIComponent(itemId)}`),
      );
    },
  };
}

export type PanoramaxClient = ReturnType<typeof createPanoramaxClient>;
