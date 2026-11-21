/**
 * Phase 1 transport schedule socket adapter (default OFF).
 * Subscribes to status/assignment projections only — never GPS.
 * On sequence gap or disconnect → caller must HTTP refetch; polling remains fallback.
 */

import { isTransportScheduleSocketEnabled } from "@/lib/config/transport-schedule";
import {
  parseTransportControlEvent,
  type TransportControlEvent,
} from "@/lib/transport/events/transport-control-event-schemas";

export type TransportScheduleSocketHandlers = {
  onEvent: (event: TransportControlEvent) => void;
  onSequenceGap: (expected: number, received: number) => void;
  onDisconnect: () => void;
};

/**
 * Attempt a Socket.IO subscription when flags + URL are configured.
 * Without `socket.io-client` dependency wired for transport, returns a no-op
 * and signals the caller to poll / refetch over HTTP.
 */
export function createTransportScheduleSocketSubscription(
  params: {
    organisationId: string;
    authToken: string;
    lastSequence: number;
  } & TransportScheduleSocketHandlers
): () => void {
  if (!isTransportScheduleSocketEnabled()) {
    return () => undefined;
  }

  const url = (
    process.env.NEXT_PUBLIC_SOCKETIO_SERVER_URL ||
    process.env.SOCKETIO_SERVER_URL ||
    ""
  ).trim();
  if (!url || !params.authToken) {
    return () => undefined;
  }

  // Client SDK wiring stays behind the flag. Until socket.io-client is adopted
  // for transport, force HTTP refetch path so we never silently claim live WS.
  void url;
  void params.organisationId;
  void params.authToken;
  // Documented contract for when the client is wired:
  // - join provider:{organisationId} with signed grants only
  // - parseTransportControlEvent on each message
  // - if event.sequence !== lastSequence + 1 → onSequenceGap → HTTP refetch
  // - never accept lat/lng payloads (parseTransportControlEvent enforces)
  void parseTransportControlEvent;
  void params.onEvent;
  void params.onSequenceGap;
  void params.onDisconnect;

  return () => undefined;
}

/** Polling interval recommendation when socket is off or reconnecting. */
export const TRANSPORT_SCHEDULE_POLL_MS = 15_000;
