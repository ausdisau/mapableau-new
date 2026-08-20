import { describe, expect, it } from "vitest";

import { mapableGoFlags } from "@/lib/config/mapable-go";
import { goFeatureDisabledResponse } from "@/lib/config/mapable-go";

describe("MapAble Go API gates", () => {
  it("returns disabled response when flags off", async () => {
    expect(mapableGoFlags.participantRoutesEnabled).toBe(false);
    const res = goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });
});
