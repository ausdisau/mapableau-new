export type PublicHfBucketFile = {
  type: "file";
  path: string;
  size: number;
  mtime?: string;
};

const HF_HUB_ORIGIN = "https://huggingface.co";
const BUCKET_ID = "ausdisau/MapAble-hg";
const PUBLIC_PREFIX = "public/";
const MAX_TEXT_BYTES = 256 * 1024;
const ALLOWED_TEXT_EXTENSIONS = new Set([".txt", ".md", ".json", ".csv", ".tsv"]);

function headers(): HeadersInit {
  const token = process.env.HF_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function validatePublicKey(key: string): string {
  const value = key.trim();
  if (
    !value.startsWith(PUBLIC_PREFIX) ||
    value.startsWith("/") ||
    value.includes("../") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    throw new Error("Public bucket reads are restricted to the public/ namespace");
  }
  return value;
}

function extensionOf(key: string): string {
  const idx = key.lastIndexOf(".");
  return idx === -1 ? "" : key.slice(idx).toLowerCase();
}

export function isPublicKnowledgeKey(key: string): boolean {
  try {
    const safe = validatePublicKey(key);
    return ALLOWED_TEXT_EXTENSIONS.has(extensionOf(safe));
  } catch {
    return false;
  }
}

export async function listPublicBucketFiles(params: {
  prefix?: string;
  limit?: number;
} = {}): Promise<PublicHfBucketFile[]> {
  const suffix = (params.prefix ?? "").trim().replace(/^\/+/, "");
  const resolvedPrefix = suffix.startsWith(PUBLIC_PREFIX)
    ? suffix
    : `${PUBLIC_PREFIX}${suffix}`;
  const encodedPrefix = encodeURIComponent(resolvedPrefix);
  const url = new URL(
    `${HF_HUB_ORIGIN}/api/buckets/${BUCKET_ID}/tree/${encodedPrefix}`,
  );
  url.searchParams.set("recursive", "true");

  const response = await fetch(url, {
    headers: headers(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to list public MapAble knowledge (${response.status})`);
  }

  const payload = (await response.json()) as Array<{
    type?: string;
    path?: string;
    size?: number;
    mtime?: string;
  }>;

  const limit = Math.max(1, Math.min(params.limit ?? 25, 50));
  return payload
    .filter(
      (item): item is PublicHfBucketFile =>
        item.type === "file" &&
        typeof item.path === "string" &&
        item.path.startsWith(PUBLIC_PREFIX) &&
        typeof item.size === "number" &&
        isPublicKnowledgeKey(item.path),
    )
    .slice(0, limit);
}

export async function readPublicBucketText(key: string): Promise<{
  key: string;
  size: number;
  text: string;
  contentType?: string;
}> {
  const safeKey = validatePublicKey(key);
  if (!ALLOWED_TEXT_EXTENSIONS.has(extensionOf(safeKey))) {
    throw new Error("Public knowledge reads are limited to text-like files");
  }

  const resolveUrl =
    `${HF_HUB_ORIGIN}/buckets/${BUCKET_ID}/resolve/${safeKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

  const head = await fetch(resolveUrl, {
    method: "HEAD",
    headers: headers(),
    redirect: "follow",
    cache: "no-store",
  });
  if (!head.ok) {
    throw new Error(`Unable to inspect public MapAble knowledge (${head.status})`);
  }

  const contentLength = Number(head.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_TEXT_BYTES) {
    throw new Error("Public knowledge object exceeds the ingestion size limit");
  }

  const response = await fetch(resolveUrl, {
    headers: headers(),
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Unable to read public MapAble knowledge (${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_TEXT_BYTES) {
    throw new Error("Public knowledge object exceeds the ingestion size limit");
  }

  return {
    key: safeKey,
    size: bytes.byteLength,
    contentType: response.headers.get("content-type") ?? undefined,
    text: new TextDecoder().decode(bytes),
  };
}
