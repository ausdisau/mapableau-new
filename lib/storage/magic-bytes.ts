const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const PDF = [0x25, 0x50, 0x44, 0x46]; // %PDF

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

/**
 * Sniff JPEG / PNG / WebP magic bytes. Returns a canonical MIME or null.
 */
export function sniffImageContentType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, JPEG)) return "image/jpeg";
  if (startsWith(bytes, PNG)) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function looksLikePlainText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 512));
  if (sample.length === 0) return false;
  for (const value of sample) {
    if (value === 0) return false;
  }
  return true;
}

/**
 * Sniff care-document bytes. Returns a canonical MIME or null.
 */
export function sniffDocumentContentType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, PDF)) return "application/pdf";
  const image = sniffImageContentType(bytes);
  if (image === "image/jpeg" || image === "image/png") return image;
  if (looksLikePlainText(bytes)) return "text/plain";
  return null;
}
