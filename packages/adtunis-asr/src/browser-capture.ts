/**
 * Browser capture helpers inspired by DiverseSpeechEngine / Adtunis Live Speech.
 * Framework-agnostic; used by adtunis-ui and MapAble client components.
 */

export type BrowserCaptureErrorCode =
  | "unsupported"
  | "permission_denied"
  | "failed";

export class BrowserCaptureError extends Error {
  constructor(
    readonly code: BrowserCaptureErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BrowserCaptureError";
  }
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new BrowserCaptureError(
      "unsupported",
      "Microphone capture is not supported in this browser.",
    );
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch (error) {
    const name =
      error && typeof error === "object" && "name" in error
        ? String((error as { name: string }).name)
        : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      throw new BrowserCaptureError(
        "permission_denied",
        "Microphone permission was denied. You can still type or use AAC.",
      );
    }
    throw new BrowserCaptureError(
      "failed",
      "Unable to start the microphone. You can still type or use AAC.",
    );
  }
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "audio/webm";
}

export type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{
      isFinal: boolean;
      0: { transcript: string; confidence: number };
    }>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

export function getBrowserSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
