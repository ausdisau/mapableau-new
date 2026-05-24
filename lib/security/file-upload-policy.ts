const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".js",
  ".html",
  ".svg",
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUpload(file: {
  name: string;
  type: string;
  size: number;
}): { ok: true } | { ok: false; reason: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: "File exceeds maximum size (10 MB)." };
  }

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { ok: false, reason: "This file type is not allowed." };
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, reason: "This file type is not allowed." };
  }

  return { ok: true };
}
