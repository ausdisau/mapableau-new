import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";
import {
  getAlexaAccountLinkingPublicStatus,
  isAlexaAccountLinkingConfigured,
} from "@/lib/home/adapters/alexa/account-linking-config";
import {
  getAlexaLinkStatusForUser,
  revokeAlexaAccountLinkForUser,
} from "@/lib/home/adapters/alexa/account-link-service";

function alexaIntegrationEnabled(): boolean {
  return (
    mapableHomeFlags.enabled &&
    mapableHomeFlags.alexaEnabled &&
    mapableHomeFlags.alexaAccountLinkingEnabled
  );
}

/** GET — session-authenticated Alexa link status. Never returns secrets/tokens. */
export async function GET() {
  if (!alexaIntegrationEnabled()) {
    return mapableHomeDisabledResponse(
      "MAPABLE_HOME_ENV_ALEXA_ACCOUNT_LINKING_ENABLED",
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const link = await getAlexaLinkStatusForUser(user.id);
  const publicConfig = getAlexaAccountLinkingPublicStatus();

  return jsonOk({
    ...link,
    configured: isAlexaAccountLinkingConfigured(),
    publicConfig: {
      grantType: publicConfig.grantType,
      pkceMethod: publicConfig.pkceMethod,
      redirectUriCount: publicConfig.redirectUriCount,
      claimState: publicConfig.claimState,
      realDeviceControl: publicConfig.realDeviceControl,
      clientIdConfigured: publicConfig.clientIdConfigured,
      clientSecretConfigured: publicConfig.clientSecretConfigured,
    },
  });
}

/**
 * DELETE — MapAble-side unlink metadata only.
 * Does not revoke Auth0 or Amazon tokens remotely.
 */
export async function DELETE() {
  if (!alexaIntegrationEnabled()) {
    return mapableHomeDisabledResponse(
      "MAPABLE_HOME_ENV_ALEXA_ACCOUNT_LINKING_ENABLED",
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const result = await revokeAlexaAccountLinkForUser(user.id);

  await createAuditEvent({
    actorUserId: user.id,
    action: "home.alexa.account_link.revoke_local",
    entityType: "ExternalAccountLink",
    entityId: user.id,
    participantId: user.id,
    metadata: {
      provider: "AMAZON_ALEXA",
      revoked: result.revoked,
      remoteRevocation: false,
      note: "MapAble metadata only; Auth0/Amazon tokens were not revoked by this API.",
    },
  });

  const link = await getAlexaLinkStatusForUser(user.id);
  return jsonOk({
    ...link,
    localRevocation: result,
    remoteRevocationPerformed: false,
  });
}
