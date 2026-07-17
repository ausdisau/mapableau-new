import { describe, expect, it } from "vitest";

import { paginate, weakEtag } from "@/lib/accountability/public-api";

describe("accountability public API helpers", () => {
  it("paginates with stable totals", () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const page1 = paginate(items, 1, 3);
    expect(page1.data).toEqual([0, 1, 2]);
    expect(page1.total).toBe(10);
    expect(page1.hasMore).toBe(true);

    const page4 = paginate(items, 4, 3);
    expect(page4.data).toEqual([9]);
    expect(page4.hasMore).toBe(false);
  });

  it("creates weak etags", () => {
    const a = weakEtag({ hello: "world" });
    const b = weakEtag({ hello: "world" });
    const c = weakEtag({ hello: "there" });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.startsWith('W/"')).toBe(true);
  });
});
