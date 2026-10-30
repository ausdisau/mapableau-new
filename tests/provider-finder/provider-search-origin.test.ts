import { describe, expect, it } from "vitest";

import { isSameOriginMutation } from "@/lib/provider/finder/same-origin";

describe("provider profile and chat same-origin guard", () => {
  it("accepts a same-origin browser mutation", () => {
    const request = new Request("https://mapable.com.au/api/providers/search-profile", {
      method: "PUT",
      headers: { Origin: "https://mapable.com.au", "Sec-Fetch-Site": "same-origin" },
    });
    expect(isSameOriginMutation(request)).toBe(true);
  });

  it("rejects cross-site requests even with an authenticated cookie", () => {
    const request = new Request("https://mapable.com.au/api/providers/search-profile", {
      method: "PUT",
      headers: { Origin: "https://evil.example", Cookie: "next-auth.session-token=fake" },
    });
    expect(isSameOriginMutation(request)).toBe(false);
  });

  it("rejects unreviewed native/cross-origin clients without browser origin", () => {
    const request = new Request("https://mapable.com.au/api/providers/chat-search", { method: "POST" });
    expect(isSameOriginMutation(request)).toBe(false);
  });
});
