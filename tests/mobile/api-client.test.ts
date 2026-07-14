
import { describe, expect, it, vi } from "vitest";
import { createMapableApiClient } from "@mapable/api-client";

describe("mapable api client", () => {
  it("calls bootstrap with auth and participant headers", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        data: {
          appRole: "participant",
          organisationId: null,
          participantId: "p1",
          flags: { MAPABLE_MOBILE_ENABLED: true },
          minimumSupportedVersion: "0.1.0",
          humanHelpPhone: null,
          navigationMode: "participant",
        },
      }),
    );

    const client = createMapableApiClient({
      baseUrl: "https://mapable.com.au",
      appVersion: "0.1.0",
      getAccessToken: async () => "token",
      getParticipantId: async () => "p1",
      getOrganisationId: async () => null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.getBootstrap();
    expect(result.bootstrap.participantId).toBe("p1");
    expect(fetchImpl).toHaveBeenCalled();
    const init = (fetchImpl.mock.calls[0]?.[1] ?? {}) as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer token");
    expect(headers.get("x-participant-id")).toBe("p1");
  });
});
