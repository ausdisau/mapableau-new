import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/providercloud/status/route";
import { buildProviderCloudStatus } from "@/lib/providercloud/status";

describe("ProviderCloud status", () => {
  it("reports a hosted read-only surface with writers and disabled supplier ops", () => {
    const status = buildProviderCloudStatus({
      MAPABLE_PROVIDERCLOUD_HOST: "cloud.mapable.com.au",
      MAPABLE_PROVIDER_OPS_ENABLED: "false",
    });

    expect(status.serviceId).toBe("providercloud");
    expect(status.host).toBe("cloud.mapable.com.au");
    expect(status.identityStatus).toBe("connected");
    expect(status.surface).toBe("hosted_read_only");
    expect(status.operations.supplierOperationsEnabled).toBe(false);
    expect(status.operations.premiumPlacement).toBe(false);
    expect(status.writers.map((writer) => writer.id)).toEqual([
      "care",
      "transport",
      "billing",
      "workforce",
      "continuity",
    ]);
  });

  it("returns the same snapshot from GET /api/providercloud/status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: ReturnType<typeof buildProviderCloudStatus>;
    };
    expect(body.status.serviceId).toBe("providercloud");
    expect(body.status.operations.supplierOperationsEnabled).toBe(false);
  });
});
