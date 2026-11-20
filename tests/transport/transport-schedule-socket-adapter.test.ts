import { afterEach, describe, expect, it } from "vitest";

import {
  createTransportScheduleSocketSubscription,
  TRANSPORT_SCHEDULE_POLL_MS,
} from "@/lib/realtime/transport-schedule-socket-adapter";

describe("transport schedule socket adapter", () => {
  afterEach(() => {
    delete process.env.TRANSPORT_SCHEDULE_SOCKET_ENABLED;
  });

  it("is a no-op when flag is off", () => {
    process.env.TRANSPORT_SCHEDULE_SOCKET_ENABLED = "false";
    const unsub = createTransportScheduleSocketSubscription({
      organisationId: "org-1",
      authToken: "token",
      lastSequence: 0,
      onEvent: () => undefined,
      onSequenceGap: () => undefined,
      onDisconnect: () => undefined,
    });
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("exposes polling fallback interval", () => {
    expect(TRANSPORT_SCHEDULE_POLL_MS).toBe(15_000);
  });
});
