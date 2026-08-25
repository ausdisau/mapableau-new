import type {
  MapAbleConnector,
  MapAbleConnectorKey,
} from "./types";
import { MAPABLE_CONNECTOR_KEYS } from "./types";

export const MAPABLE_CONNECTOR_REGISTRY: Record<
  MapAbleConnectorKey,
  MapAbleConnector
> = {
  stripe_billing: {
    key: "stripe_billing",
    version: "1.0.0",
    domain: "billing",
    mode: "read_write",
    dataClasses: ["financial", "operational"],
    requiredConsentScopes: ["billing.read"],
    allowedOperations: [
      "get_checkout_session_status",
      "create_checkout_session_stub",
    ],
    featureFlag: "MAPABLE_CONNECTOR_STRIPE_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_STRIPE_KILL_SWITCH",
    healthCheck: { probeKey: "stripe_api", intervalMs: 60_000 },
    timeoutMs: 8_000,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      retryOn: ["timeout", "transient", "rate_limit"],
    },
    idempotencySupport: true,
    auditPolicy: { auditReads: true, auditWrites: true, includePayloadHash: true },
    maturity: "live",
    inventoryNote:
      "Live Stripe product paths exist (billing/core, ads top-up). Gateway adapter is a thin policy wrapper; live calls remain behind product + connector flags.",
    label: "Stripe billing",
  },
  email_sendgrid: {
    key: "email_sendgrid",
    version: "1.0.0",
    domain: "notifications",
    mode: "write",
    dataClasses: ["participant_pii", "operational"],
    requiredConsentScopes: ["notifications.email"],
    allowedOperations: ["send_transactional_email"],
    featureFlag: "MAPABLE_CONNECTOR_EMAIL_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_EMAIL_KILL_SWITCH",
    healthCheck: { probeKey: "sendgrid_api", intervalMs: 60_000 },
    timeoutMs: 5_000,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 150,
      maxDelayMs: 1_000,
      retryOn: ["timeout", "transient"],
    },
    idempotencySupport: true,
    auditPolicy: { auditReads: false, auditWrites: true, includePayloadHash: true },
    maturity: "live",
    inventoryNote:
      "SendGrid helpers exist (lib/sendGrid.ts, lib/notifications/sendgrid.ts). Gateway write requires approved Action Kernel envelope.",
    label: "Email (SendGrid)",
  },
  messaging_internal: {
    key: "messaging_internal",
    version: "1.0.0",
    domain: "messaging",
    mode: "write",
    dataClasses: ["participant_pii", "operational"],
    requiredConsentScopes: ["messaging.send"],
    allowedOperations: ["send_provider_message"],
    featureFlag: "MAPABLE_CONNECTOR_MESSAGING_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_MESSAGING_KILL_SWITCH",
    healthCheck: { probeKey: "messaging_service", intervalMs: 60_000 },
    timeoutMs: 5_000,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 800,
      retryOn: ["timeout", "transient"],
    },
    idempotencySupport: true,
    auditPolicy: { auditReads: false, auditWrites: true, includePayloadHash: true },
    maturity: "live",
    inventoryNote:
      "Internal messaging via lib/messages/message-service — already used by Action Kernel send_provider_message adapter.",
    label: "Internal messaging",
  },
  maps_geocode: {
    key: "maps_geocode",
    version: "1.0.0",
    domain: "maps",
    mode: "read",
    dataClasses: ["public", "operational"],
    requiredConsentScopes: ["maps.read"],
    allowedOperations: ["geocode_lookup", "accessibility_layer_stub"],
    featureFlag: "MAPABLE_CONNECTOR_MAPS_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_MAPS_KILL_SWITCH",
    healthCheck: { probeKey: "maps_provider", intervalMs: 120_000 },
    timeoutMs: 6_000,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 800,
      retryOn: ["timeout", "transient"],
    },
    idempotencySupport: false,
    auditPolicy: { auditReads: true, auditWrites: false, includePayloadHash: false },
    maturity: "stub",
    inventoryNote:
      "Map/access layers exist (lib/map, accessibility-map, OSM config). Gateway geocode adapter is a stub/thin wrapper when flags off.",
    label: "Maps / geocode",
  },
  gais_access_read: {
    key: "gais_access_read",
    version: "1.0.0",
    domain: "access_intelligence",
    mode: "read",
    dataClasses: ["public", "operational"],
    requiredConsentScopes: ["gais.read"],
    allowedOperations: ["read_access_place", "list_community_barriers"],
    featureFlag: "MAPABLE_CONNECTOR_GAIS_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_GAIS_KILL_SWITCH",
    healthCheck: { probeKey: "gais_read", intervalMs: 60_000 },
    timeoutMs: 5_000,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 800,
      retryOn: ["timeout", "transient"],
    },
    idempotencySupport: false,
    auditPolicy: { auditReads: true, auditWrites: false, includePayloadHash: false },
    maturity: "live",
    inventoryNote:
      "GAIS Phase 0 read service exists (MAPABLE_GAIS_* flags). Connector wraps read with purpose/consent/provenance.",
    label: "GAIS access read",
  },
  calendar_events: {
    key: "calendar_events",
    version: "1.0.0",
    domain: "calendar",
    mode: "read_write",
    dataClasses: ["participant_pii", "operational"],
    requiredConsentScopes: ["calendar.read"],
    allowedOperations: ["list_events", "sync_care_request_stub"],
    featureFlag: "MAPABLE_CONNECTOR_CALENDAR_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_CALENDAR_KILL_SWITCH",
    healthCheck: { probeKey: "calendar_store", intervalMs: 60_000 },
    timeoutMs: 5_000,
    retryPolicy: {
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 800,
      retryOn: ["timeout", "transient"],
    },
    idempotencySupport: true,
    auditPolicy: { auditReads: true, auditWrites: true, includePayloadHash: true },
    maturity: "live",
    inventoryNote:
      "Internal Prisma calendar (lib/calendar/calendar-service). Descriptions treated as DATA (injection-safe).",
    label: "Calendar events",
  },
  ndia_claiming: {
    key: "ndia_claiming",
    version: "1.0.0",
    domain: "ndis_claiming",
    mode: "read_write",
    dataClasses: ["financial", "health_sensitive", "participant_pii"],
    requiredConsentScopes: ["ndis.claims.read"],
    allowedOperations: ["get_claim_status_stub", "submit_claim_batch_stub"],
    featureFlag: "MAPABLE_CONNECTOR_NDIA_ENABLED",
    killSwitchKey: "MAPABLE_CONNECTOR_NDIA_KILL_SWITCH",
    healthCheck: { probeKey: "ndia_adapter", intervalMs: 120_000 },
    timeoutMs: 10_000,
    retryPolicy: {
      maxAttempts: 1,
      baseDelayMs: 200,
      maxDelayMs: 200,
      retryOn: [],
    },
    idempotencySupport: true,
    auditPolicy: { auditReads: true, auditWrites: true, includePayloadHash: true },
    maturity: "exploratory",
    inventoryNote:
      "NDIA API adapter is an exploratory stub (NdiaApiAdapter.stub). Real submission requires legal/account-owner decision; gateway never enables live NDIA by default.",
    label: "NDIA claiming (exploratory)",
  },
};

export function listMapAbleConnectors(): MapAbleConnector[] {
  return MAPABLE_CONNECTOR_KEYS.map((k) => MAPABLE_CONNECTOR_REGISTRY[k]);
}

export function getMapAbleConnector(
  key: MapAbleConnectorKey,
): MapAbleConnector | undefined {
  return MAPABLE_CONNECTOR_REGISTRY[key];
}

export function requireMapAbleConnector(
  key: MapAbleConnectorKey,
): MapAbleConnector {
  const connector = getMapAbleConnector(key);
  if (!connector) throw new Error(`UNKNOWN_CONNECTOR:${key}`);
  return connector;
}

export function isMapAbleConnectorKey(value: string): value is MapAbleConnectorKey {
  return (MAPABLE_CONNECTOR_KEYS as readonly string[]).includes(value);
}

export function listConnectorInventory(): Array<{
  key: MapAbleConnectorKey;
  label: string;
  maturity: MapAbleConnector["maturity"];
  mode: MapAbleConnector["mode"];
  inventoryNote: string;
}> {
  return listMapAbleConnectors().map((c) => ({
    key: c.key,
    label: c.label,
    maturity: c.maturity,
    mode: c.mode,
    inventoryNote: c.inventoryNote,
  }));
}
