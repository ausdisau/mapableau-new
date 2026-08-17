/**
 * Minimal S3-compatible REST gateway adapter (R2/MinIO-style proxy).
 * Kept as a compatibility ObjectStorageProvider. Domain code must not call this
 * directly — future S3/R2/SeaweedFS/Garage support belongs on ObjectStore.
 */
export class S3RestObjectStorageProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string | undefined;

  constructor(
    baseUrl = process.env.S3_REST_BASE_URL?.trim(),
    authHeader = process.env.S3_REST_AUTH_HEADER?.trim(),
  ) {
    if (!baseUrl) throw new Error("S3_REST_BASE_URL is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authHeader = authHeader;
  }

  private headers(contentType?: string): HeadersInit {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (this.authHeader) headers.Authorization = this.authHeader;
    return headers;
  }

  async putObject(input: {
    key: string;
    data: Uint8Array;
    contentType: string;
  }): Promise<{ key: string; version: string; sizeBytes: number }> {
    const response = await fetch(
      `${this.baseUrl}/objects/${encodeURIComponent(input.key)}`,
      {
        method: "PUT",
        headers: this.headers(input.contentType),
        body: Buffer.from(input.data),
      },
    );
    if (!response.ok) throw new Error(`S3_PUT_FAILED:${response.status}`);
    const version =
      response.headers.get("x-object-version") ??
      response.headers.get("etag") ??
      "latest";
    return {
      key: input.key,
      version,
      sizeBytes: input.data.byteLength,
    };
  }

  async getObject(input: { key: string }): Promise<Uint8Array> {
    const response = await fetch(
      `${this.baseUrl}/objects/${encodeURIComponent(input.key)}`,
      { headers: this.headers() },
    );
    if (!response.ok) throw new Error(`S3_GET_FAILED:${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async createSignedUrl(input: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/signed-url`, {
      method: "POST",
      headers: { ...this.headers("application/json") },
      body: JSON.stringify({
        key: input.key,
        expiresInSeconds: input.expiresInSeconds,
      }),
    });
    if (!response.ok) throw new Error(`S3_SIGNED_URL_FAILED:${response.status}`);
    const body = (await response.json()) as { url?: string };
    if (!body.url) throw new Error("S3_SIGNED_URL_MISSING");
    return body.url;
  }

  async deleteObject(input: { key: string }): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/objects/${encodeURIComponent(input.key)}`,
      { method: "DELETE", headers: this.headers() },
    );
    if (!response.ok) throw new Error(`S3_DELETE_FAILED:${response.status}`);
  }
}
