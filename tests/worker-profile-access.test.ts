import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { canAccessWorkerProfile } from "@/lib/workers/worker-profile-access";

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn(),
}));

const supportWorker: CurrentUser = {
  id: "user-a",
  email: "a@example.com",
  name: "Alex",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "support_worker",
  roles: ["support_worker"],
};

describe("canAccessWorkerProfile", () => {
  beforeEach(() => {
    vi.mocked(getUserOrganisationIds).mockReset();
  });

  it("allows the profile owner", async () => {
    const allowed = await canAccessWorkerProfile(supportWorker, {
      id: "wp-1",
      userId: "user-a",
      organisationId: "org-1",
    });
    expect(allowed).toBe(true);
    expect(getUserOrganisationIds).not.toHaveBeenCalled();
  });

  it("allows users in the same organisation", async () => {
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-1"]);
    const allowed = await canAccessWorkerProfile(supportWorker, {
      id: "wp-2",
      userId: "user-b",
      organisationId: "org-1",
    });
    expect(allowed).toBe(true);
  });

  it("denies users outside the organisation", async () => {
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-other"]);
    const allowed = await canAccessWorkerProfile(supportWorker, {
      id: "wp-3",
      userId: "user-c",
      organisationId: "org-1",
    });
    expect(allowed).toBe(false);
  });

  it("allows mapable admins", async () => {
    const admin: CurrentUser = { ...supportWorker, primaryRole: "mapable_admin" };
    const allowed = await canAccessWorkerProfile(admin, {
      id: "wp-4",
      userId: "user-d",
      organisationId: "org-1",
    });
    expect(allowed).toBe(true);
  });
});
