import { randomUUID } from "node:crypto";

import type {
  ConnectorActor,
  ConnectorCredentialHandle,
  MapAbleConnectorKey,
} from "./types";

export const FORBIDDEN_AGENT_SECRET_KINDS = [
  "api_key",
  "oauth_refresh_token",
  "db_credential",
  "webhook_secret",
  "service_admin_credential",
] as const;

export type ForbiddenAgentSecretKind =
  (typeof FORBIDDEN_AGENT_SECRET_KINDS)[number];

type CredentialVaultEntry = {
  handle: ConnectorCredentialHandle;
  envVarName: string;
  secretKind: ForbiddenAgentSecretKind;
};

const handles = new Map<string, CredentialVaultEntry>();

const CONNECTOR_ENV_MAP: Partial<
  Record<
    MapAbleConnectorKey,
    {
      envVarName: string;
      secretKind: ForbiddenAgentSecretKind;
      label: string;
      scope: string[];
    }
  >
> = {
  stripe_billing: {
    envVarName: "STRIPE_SECRET_KEY",
    secretKind: "api_key",
    label: "stripe-secret",
    scope: ["billing.read", "billing.write"],
  },
  email_sendgrid: {
    envVarName: "SENDGRID_API_KEY",
    secretKind: "api_key",
    label: "sendgrid-api",
    scope: ["notifications.email"],
  },
  ndia_claiming: {
    envVarName: "NDIA_PROVIDER_API_CLIENT_SECRET",
    secretKind: "oauth_refresh_token",
    label: "ndia-client",
    scope: ["ndis.claims.read"],
  },
};

export function issueCredentialHandle(
  connectorKey: MapAbleConnectorKey,
): ConnectorCredentialHandle | null {
  const meta = CONNECTOR_ENV_MAP[connectorKey];
  if (!meta) {
    return {
      handleId: `hdl_${connectorKey}_none`,
      connectorKey,
      scope: [],
      label: "no-credential-required",
    };
  }

  const handle: ConnectorCredentialHandle = {
    handleId: `hdl_${randomUUID()}`,
    connectorKey,
    scope: meta.scope,
    label: meta.label,
  };
  handles.set(handle.handleId, {
    handle,
    envVarName: meta.envVarName,
    secretKind: meta.secretKind,
  });
  return handle;
}

export function getCredentialViewForActor(
  handleId: string,
  actor: ConnectorActor,
):
  | { ok: true; handle: ConnectorCredentialHandle }
  | {
      ok: false;
      reason: "agent_credential_access_denied";
      deniedKinds: ForbiddenAgentSecretKind[];
    } {
  const entry = handles.get(handleId);
  if (!entry) {
    return {
      ok: false,
      reason: "agent_credential_access_denied",
      deniedKinds: [...FORBIDDEN_AGENT_SECRET_KINDS],
    };
  }

  if (actor.role === "agent" || actor.actorType === "agent") {
    return {
      ok: false,
      reason: "agent_credential_access_denied",
      deniedKinds: [...FORBIDDEN_AGENT_SECRET_KINDS],
    };
  }

  return { ok: true, handle: entry.handle };
}

export function materialiseCredentialForGateway(
  handleId: string,
  actor: ConnectorActor,
):
  | {
      ok: true;
      present: boolean;
      envVarName: string;
      secretKind: ForbiddenAgentSecretKind;
    }
  | {
      ok: false;
      reason:
        | "agent_credential_access_denied"
        | "handle_not_found"
        | "role_not_gateway";
    } {
  if (actor.role !== "gateway") {
    return { ok: false, reason: "role_not_gateway" };
  }
  if (actor.actorType === "agent") {
    return { ok: false, reason: "agent_credential_access_denied" };
  }

  const entry = handles.get(handleId);
  if (!entry) {
    if (handleId.endsWith("_none")) {
      return {
        ok: true,
        present: false,
        envVarName: "",
        secretKind: "api_key",
      };
    }
    return { ok: false, reason: "handle_not_found" };
  }

  const present = Boolean(process.env[entry.envVarName]);
  return {
    ok: true,
    present,
    envVarName: entry.envVarName,
    secretKind: entry.secretKind,
  };
}

export function agentCannotAccessSecret(
  handleId: string,
  agentActor: ConnectorActor,
): boolean {
  const view = getCredentialViewForActor(handleId, agentActor);
  return view.ok === false && view.reason === "agent_credential_access_denied";
}

export function clearCredentialHandles(): void {
  handles.clear();
}
