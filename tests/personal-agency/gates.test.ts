import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/personal-agency", () => ({
  personalAgencyFlags: {
    routesEnabled: false,
    lifeIntentsEnabled: false,
  },
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

describe("personal-agency gates", () => {
  it("redirects when PAI UI flag is off", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user_1",
      name: "Test",
      email: "t@example.com",
      primaryRole: "participant",
    } as never);

    await expect(requirePersonalAgencyGate()).rejects.toThrow("REDIRECT:/dashboard");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
