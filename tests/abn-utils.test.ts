import { describe, expect, it } from "vitest";

import {
  formatAbn,
  stripAbn,
  validateAbn,
  validateAbnChecksum,
  lookupAbnRegistry,
} from "@/lib/ndis/abn-utils";

describe("ABN utilities (REPL port)", () => {
  it("strips and formats valid ABNs", () => {
    expect(stripAbn("53 004 085 616")).toBe("53004085616");
    expect(formatAbn("53004085616")).toBe("53 004 085 616");
  });

  it("validates checksum for a known good ABN", () => {
    // Australian Business Register example-style valid checksum ABN
    expect(validateAbnChecksum("51824753556")).toBe(true);
    expect(validateAbn("51 824 753 556").valid).toBe(true);
  });

  it("rejects invalid checksums", () => {
    expect(validateAbn("12345678901").valid).toBe(false);
  });

  it("returns offline ABR result when ABR_GUID is unset", async () => {
    const prev = process.env.ABR_GUID;
    delete process.env.ABR_GUID;
    const result = await lookupAbnRegistry("51824753556");
    expect(result.offline).toBe(true);
    expect(result.abnFormatted).toBe("51 824 753 556");
    if (prev !== undefined) process.env.ABR_GUID = prev;
  });
});
