/**
 * Governed Connector Gateway feature flags — fail-closed by default.
 * Master flag does not enable individual connectors; each retains its own flag.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const CONNECTOR_GATEWAY_MASTER_FLAG =
  "MAPABLE_CONNECTOR_GATEWAY_ENABLED";

export const connectorGatewayConfig = {
  get enabled(): boolean {
    return envFlag(CONNECTOR_GATEWAY_MASTER_FLAG, false);
  },
  get killSwitchEngaged(): boolean {
    return envFlag("MAPABLE_CONNECTOR_GATEWAY_KILL_SWITCH", false);
  },
  get stripeEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_STRIPE_ENABLED", false);
  },
  get emailEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_EMAIL_ENABLED", false);
  },
  get messagingEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_MESSAGING_ENABLED", false);
  },
  get mapsEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_MAPS_ENABLED", false);
  },
  get gaisEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_GAIS_ENABLED", false);
  },
  get calendarEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_CALENDAR_ENABLED", false);
  },
  get ndiaEnabled(): boolean {
    return this.enabled && envFlag("MAPABLE_CONNECTOR_NDIA_ENABLED", false);
  },
};

export function isConnectorGatewayOperational(): boolean {
  return (
    connectorGatewayConfig.enabled && !connectorGatewayConfig.killSwitchEngaged
  );
}

const CONNECTOR_FLAGS = {
  stripe_billing: () => connectorGatewayConfig.stripeEnabled,
  email_sendgrid: () => connectorGatewayConfig.emailEnabled,
  messaging_internal: () => connectorGatewayConfig.messagingEnabled,
  maps_geocode: () => connectorGatewayConfig.mapsEnabled,
  gais_access_read: () => connectorGatewayConfig.gaisEnabled,
  calendar_events: () => connectorGatewayConfig.calendarEnabled,
  ndia_claiming: () => connectorGatewayConfig.ndiaEnabled,
} as const;

export type ConnectorFlagKey = keyof typeof CONNECTOR_FLAGS;

export function isConnectorEnabled(key: ConnectorFlagKey): boolean {
  if (!isConnectorGatewayOperational()) return false;
  return CONNECTOR_FLAGS[key]();
}
