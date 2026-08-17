const UNSAFE_FILENAME = /[^a-zA-Z0-9._-]/g;
const MAX_FILENAME_LENGTH = 180;

export function sanitiseOriginalFilename(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop()?.trim() ?? "upload";
  const cleaned = base.replace(UNSAFE_FILENAME, "_").replace(/_+/g, "_");
  const trimmed = cleaned.replace(/^[._]+/, "").slice(0, MAX_FILENAME_LENGTH);
  return trimmed.length > 0 ? trimmed : "upload";
}

export function extensionFromFilename(originalName: string): string {
  const safe = sanitiseOriginalFilename(originalName);
  const dot = safe.lastIndexOf(".");
  if (dot <= 0 || dot === safe.length - 1) return "";
  return safe.slice(dot + 1).toLowerCase();
}
