export type RecognitionResult = {
  raw: string;
  alternatives: string[];
  confidence: number | null;
  uncertainty: "low" | "moderate" | "unknown";
};

export interface SpeechModelProvider {
  readonly id: string;
  recognize(input: {
    audio: Buffer;
    contentType: string;
    profileId: string;
  }): Promise<RecognitionResult>;
}

const isPrivateHost = (host: string) => {
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "::1"
  ) {
    return true;
  }
  const octets = normalized.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
};

type EnvLike = Record<string, string | undefined>;

function approvedEndpoint(env: EnvLike = process.env): URL | null {
  if (env.ADTUNIS_ASR_APPROVED !== "true") return null;
  const raw = env.ADTUNIS_ASR_ENDPOINT;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !isPrivateHost(url.hostname) ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export class SelfHostedSpeechProvider implements SpeechModelProvider {
  readonly id = "self-hosted-asr";

  constructor(private readonly env: EnvLike = process.env) {}

  async recognize(input: {
    audio: Buffer;
    contentType: string;
    profileId: string;
  }): Promise<RecognitionResult> {
    const endpoint = approvedEndpoint(this.env);
    if (!endpoint) {
      throw new Error(
        "Live recognition is unavailable: an approved private self-hosted ASR endpoint is not configured.",
      );
    }
    if (input.audio.length === 0) throw new Error("The recording is empty.");
    if (input.audio.length > 25 * 1024 * 1024) {
      throw new Error("The recording exceeds the 25 MB limit.");
    }
    if (!/^audio\/[a-z0-9.+-]+$/i.test(input.contentType)) {
      throw new Error("The recording format is not supported.");
    }

    const headers: Record<string, string> = {
      "Content-Type": input.contentType,
      "X-Adtunis-Profile": input.profileId,
    };
    if (this.env.ADTUNIS_ASR_TOKEN) {
      headers.Authorization = `Bearer ${this.env.ADTUNIS_ASR_TOKEN}`;
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: new Uint8Array(input.audio),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `The private speech service returned HTTP ${response.status}.`,
      );
    }
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") {
      throw new Error("The private speech service returned an invalid body.");
    }
    const raw = (body as { raw?: unknown }).raw;
    if (typeof raw !== "string" || raw.length === 0 || raw.length > 2000) {
      throw new Error(
        "The private speech service returned an invalid raw candidate.",
      );
    }
    const alternativesValue = (body as { alternatives?: unknown }).alternatives;
    const alternatives = Array.isArray(alternativesValue)
      ? alternativesValue
          .filter((candidate): candidate is string => typeof candidate === "string")
          .slice(0, 5)
      : [];
    const confidenceValue = (body as { confidence?: unknown }).confidence;
    const confidence =
      typeof confidenceValue === "number" &&
      Number.isFinite(confidenceValue) &&
      confidenceValue >= 0 &&
      confidenceValue <= 1
        ? confidenceValue
        : null;
    const uncertaintyValue = (body as { uncertainty?: unknown }).uncertainty;
    const uncertainty =
      uncertaintyValue === "low" || uncertaintyValue === "moderate"
        ? uncertaintyValue
        : "unknown";
    return { raw, alternatives, confidence, uncertainty };
  }
}

/** Deterministic mock for tests and local Care demos. Never claims live ASR. */
export class SimulatedSpeechProvider implements SpeechModelProvider {
  readonly id = "simulated-asr";

  async recognize(input: {
    audio: Buffer;
    contentType: string;
    profileId: string;
  }): Promise<RecognitionResult> {
    if (input.audio.length === 0) throw new Error("The recording is empty.");
    if (!/^audio\/[a-z0-9.+-]+$/i.test(input.contentType)) {
      throw new Error("The recording format is not supported.");
    }
    return {
      raw: "I need support this afternoon",
      alternatives: [
        "I need support this afternoon",
        "I need support this morning",
      ],
      confidence: 0.55,
      uncertainty: "moderate",
    };
  }
}

/** Fail-closed stubs for evaluation providers — not connected. */
export class UnavailableProviderStub implements SpeechModelProvider {
  constructor(
    readonly id: string,
    private readonly reason: string,
  ) {}

  async recognize(): Promise<RecognitionResult> {
    throw new Error(this.reason);
  }
}

export function createSpeechProvider(env: EnvLike = process.env): SpeechModelProvider {
  if (env.ADTUNIS_SIMULATED_ASR === "true") {
    return new SimulatedSpeechProvider();
  }
  return new SelfHostedSpeechProvider(env);
}

export function speechStatus(env: EnvLike = process.env) {
  const simulated = env.ADTUNIS_SIMULATED_ASR === "true";
  const recognitionReady = simulated || approvedEndpoint(env) !== null;
  const retentionDays = Number(env.ADTUNIS_AUDIO_RETENTION_DAYS);
  const retentionAvailable =
    env.ADTUNIS_AUDIO_RETENTION_APPROVED === "true" &&
    Number.isInteger(retentionDays) &&
    retentionDays >= 1 &&
    retentionDays <= 365;
  return {
    recognitionReady,
    simulated,
    retentionAvailable,
    retentionDays: retentionAvailable ? retentionDays : null,
    detail: simulated
      ? "Simulated ASR is enabled for local demos. Candidates are synthetic and must be reviewed before any send."
      : recognitionReady
        ? "Recognition uses the reviewed private self-hosted endpoint. Audio is processed only after separate transcription consent."
        : "Live recognition is blocked until a private self-hosted ASR endpoint is reviewed and configured, or ADTUNIS_SIMULATED_ASR=true for demos.",
  };
}
