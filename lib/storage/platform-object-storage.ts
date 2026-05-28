import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type PlatformStorageBackend = "local" | "s3";

export type PutObjectInput = {
  key: string;
  body: Buffer;
  contentType?: string;
};

export type ObjectMetadata = {
  key: string;
  size: number;
  contentType: string;
  updatedAt: Date;
};

const LOCAL_ROOT = path.join(process.cwd(), ".data", "platform-storage");

function normalizeKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) throw new Error("Key is required");
  const normalized = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

function localPathForKey(key: string): string {
  return path.join(LOCAL_ROOT, normalizeKey(key));
}

function inferContentType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export function getPlatformStorageBackend(): PlatformStorageBackend {
  return process.env.PLATFORM_STORAGE_BACKEND === "s3" ? "s3" : "local";
}

export async function putObject(input: PutObjectInput): Promise<ObjectMetadata> {
  const key = normalizeKey(input.key);

  if (getPlatformStorageBackend() === "s3") {
    throw new Error("S3 backend not configured yet");
  }

  const destination = localPathForKey(key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, input.body);

  const fileStat = await stat(destination);
  return {
    key,
    size: fileStat.size,
    contentType: input.contentType ?? inferContentType(key),
    updatedAt: fileStat.mtime,
  };
}

export async function getObject(key: string): Promise<Buffer> {
  const safeKey = normalizeKey(key);
  if (getPlatformStorageBackend() === "s3") {
    throw new Error("S3 backend not configured yet");
  }
  return readFile(localPathForKey(safeKey));
}

export async function deleteObject(key: string): Promise<void> {
  const safeKey = normalizeKey(key);
  if (getPlatformStorageBackend() === "s3") {
    throw new Error("S3 backend not configured yet");
  }
  await rm(localPathForKey(safeKey), { force: true });
}

export async function listPrefix(prefix: string): Promise<ObjectMetadata[]> {
  const safePrefix = normalizeKey(prefix);
  if (getPlatformStorageBackend() === "s3") {
    throw new Error("S3 backend not configured yet");
  }

  const folder = localPathForKey(safePrefix);
  const entries = await readdir(folder, { withFileTypes: true }).catch(() => []);
  const files = entries.filter((entry) => entry.isFile());

  const results = await Promise.all(
    files.map(async (entry) => {
      const relKey = `${safePrefix}/${entry.name}`;
      const fileStat = await stat(path.join(folder, entry.name));
      return {
        key: relKey,
        size: fileStat.size,
        contentType: inferContentType(relKey),
        updatedAt: fileStat.mtime,
      } satisfies ObjectMetadata;
    }),
  );

  return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function makeContentAddressedKey(prefix: string, body: Buffer, extension = "bin"): string {
  const hash = createHash("sha256").update(body).digest("hex");
  const normalizedPrefix = normalizeKey(prefix);
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `${normalizedPrefix}/${hash}.${safeExt}`;
}

export function getLocalStorageRoot(): string {
  return LOCAL_ROOT;
}
