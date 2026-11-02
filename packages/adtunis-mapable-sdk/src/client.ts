import type {
  AdtunisWorkspace,
  BridgeRequest,
  IntentConfirmation,
  WorkspaceAction,
} from "@mapable/adtunis-core";

export type AdtunisClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(
      typeof body === "object" && body && "error" in body && body.error
        ? String(body.error)
        : `Request failed (${response.status})`,
    );
  }
  return body;
}

export class AdtunisClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AdtunisClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  workspace(): Promise<AdtunisWorkspace> {
    return this.fetchImpl(`${this.baseUrl}/api/v1/adtunis/workspace`, {
      credentials: "include",
      cache: "no-store",
    }).then((response) => parseJson<AdtunisWorkspace>(response));
  }

  speechStatus(): Promise<{
    recognitionReady: boolean;
    simulated: boolean;
    detail: string;
  }> {
    return this.fetchImpl(`${this.baseUrl}/api/v1/adtunis/speech/status`, {
      credentials: "include",
      cache: "no-store",
    }).then((response) =>
      parseJson<{
        recognitionReady: boolean;
        simulated: boolean;
        detail: string;
      }>(response),
    );
  }

  performAction(action: WorkspaceAction): Promise<AdtunisWorkspace> {
    return this.fetchImpl(`${this.baseUrl}/api/v1/adtunis/actions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    }).then((response) => parseJson<AdtunisWorkspace>(response));
  }

  recognize(audio: Blob): Promise<AdtunisWorkspace> {
    return this.fetchImpl(`${this.baseUrl}/api/v1/adtunis/recognize`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": audio.type || "audio/webm" },
      body: audio,
    }).then((response) => parseJson<AdtunisWorkspace>(response));
  }

  confirmIntent(body: IntentConfirmation): Promise<{
    workspace: AdtunisWorkspace;
    delivery: {
      mode: "mock" | "live";
      label: string;
      simulated: boolean;
      deliveryId: string;
      conversationId: string | null;
    };
  }> {
    return this.fetchImpl(`${this.baseUrl}/api/v1/adtunis/intent-confirmations`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": body.idempotencyKey,
      },
      body: JSON.stringify(body),
    }).then((response) =>
      parseJson<{
        workspace: AdtunisWorkspace;
        delivery: {
          mode: "mock" | "live";
          label: string;
          simulated: boolean;
          deliveryId: string;
          conversationId: string | null;
        };
      }>(response),
    );
  }

  callBridge(request: BridgeRequest): Promise<unknown> {
    return this.fetchImpl(`${this.baseUrl}/api/v1/adtunis/bridge`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }).then((response) => parseJson(response));
  }
}
