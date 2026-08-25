import type { AuthorizedHomeAction, HomeActionReceipt } from "./action";
import type { HomeEndpoint } from "./environment";
import type { CapabilityState } from "./state";

export const HOME_ADAPTER_PROVIDERS = [
  "SIMULATOR",
  "MATTER",
  "GOOGLE_HOME",
  "ALEXA",
  "HOME_ASSISTANT",
  "OTHER",
] as const;

export type HomeAdapterProvider = (typeof HOME_ADAPTER_PROVIDERS)[number];

export type HomeAdapterStatus =
  | "READY"
  | "DISABLED"
  | "SCAFFOLDED"
  | "ERROR"
  | "UNSUPPORTED";

/**
 * Adapter boundary. Only AuthorizedHomeAction may reach execute().
 * HomeActionRequest must never be accepted here.
 */
export type HomeCapabilityAdapter = {
  id: string;
  provider: HomeAdapterProvider;
  status: HomeAdapterStatus;
  discover(): Promise<HomeEndpoint[]>;
  getState(endpointId: string, capabilityId: string): Promise<CapabilityState>;
  execute(action: AuthorizedHomeAction): Promise<HomeActionReceipt>;
  proposeSupport?(capabilityId: string): Promise<{
    supported: boolean;
    notes?: string;
  }>;
};
