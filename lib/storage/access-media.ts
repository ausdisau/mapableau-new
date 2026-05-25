import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "access");

export async function saveAccessMediaFile(params: {
  buffer: Buffer;
  mimeType: string;
  prefix: "reviews" | "accreditation" | "venue" | "floorplans";
}): Promise<string> {
  const ext =
    params.mimeType === "image/png"
      ? ".png"
      : params.mimeType === "image/webp"
        ? ".webp"
        : params.mimeType === "application/pdf"
          ? ".pdf"
          : ".jpg";
  const dir = path.join(UPLOAD_ROOT, params.prefix);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  const full = path.join(dir, name);
  await writeFile(full, params.buffer);
  return path.relative(process.cwd(), full);
}

export async function readAccessMediaFile(
  storagePath: string,
): Promise<Buffer> {
  const full = path.resolve(process.cwd(), storagePath);
  const root = path.resolve(UPLOAD_ROOT);
  if (!full.startsWith(root)) {
    throw new Error("INVALID_STORAGE_PATH");
  }
  return readFile(full);
}
