import { describe, expect, it } from "vitest";

import { mergeJwtTokenIntoSession } from "@/lib/auth/nextauth-session";

describe("WorkOS session privacy", () => {
  it("does not expose WorkOS access or refresh tokens in the public session", () => {
    const session = mergeJwtTokenIntoSession(
      { user: {} },
      {
        id: "user_01",
        role: "participant",
        workosAccessToken: "access_secret",
        workosRefreshToken: "refresh_secret",
      },
    );

    expect(session.user).toEqual({ id: "user_01", role: "participant" });
    expect(JSON.stringify(session)).not.toContain("access_secret");
    expect(JSON.stringify(session)).not.toContain("refresh_secret");
  });
});
