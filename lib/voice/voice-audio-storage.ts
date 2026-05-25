import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const VOICE_AUDIO_ROOT = path.join(process.cwd(), ".data", "voice-audio");

export async function storeVoiceAudioTemp(
  sessionId: string,
  buffer: Buffer,
  extension: string
): Promise<string> {
  await mkdir(VOICE_AUDIO_ROOT, { recursive: true });
  const safeExt = extension.replace(/[^a-z0-9]/gi, "") || "webm";
  const fileKey = `${sessionId}.${safeExt}`;
  await writeFile(path.join(VOICE_AUDIO_ROOT, fileKey), buffer);
  return fileKey;
}

export async function deleteVoiceAudio(fileKey: string): Promise<void> {
  try {
    const safe = path.basename(fileKey);
    await unlink(path.join(VOICE_AUDIO_ROOT, safe));
  } catch {
    /* already removed */
  }
}

export function extensionFromMime(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return "bin";
}
