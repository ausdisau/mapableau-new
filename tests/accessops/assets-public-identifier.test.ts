import { describe, expect, it } from "vitest";

import { createAccessAssetPublicIdentifier } from "@/lib/accessops/assets/asset-service";

describe("AccessOps asset public identifiers", () => {
  it("uses opaque acc_ identifiers", () => {
    const id = createAccessAssetPublicIdentifier();
    expect(id).toMatch(/^acc_[a-z0-9]+_[A-Za-z0-9_-]+$/);
    expect(id).not.toContain("owner");
  });
});
