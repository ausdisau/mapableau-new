import { describe, expect, it } from "vitest";

import {
  getAccountMenuActions,
  getAccountMenuButtonLabel,
  getUserInitials,
  withAvatarCacheVersion,
} from "@/lib/profile/user-initials";

describe("getUserInitials", () => {
  it("uses two initials from a multi-word name", () => {
    expect(getUserInitials("Ada Lovelace")).toBe("AL");
  });

  it("supports one-word names with up to two characters", () => {
    expect(getUserInitials("Madonna")).toBe("MA");
    expect(getUserInitials("李")).toBe("李");
  });

  it("supports Unicode names", () => {
    expect(getUserInitials("José García")).toBe("JG");
    expect(getUserInitials("田中 太郎")).toBe("田太");
  });

  it("falls back to email local-part only when name is missing", () => {
    expect(getUserInitials("", "casey@example.com")).toBe("CA");
    expect(getUserInitials(null, "a@example.com")).toBe("A");
  });

  it("never uses email when a display name exists", () => {
    expect(getUserInitials("Pat", "zzzz@example.com")).toBe("PA");
  });

  it("returns ? when neither name nor email is usable", () => {
    expect(getUserInitials("", "")).toBe("?");
    expect(getUserInitials(undefined, undefined)).toBe("?");
  });
});

describe("getAccountMenuButtonLabel", () => {
  it("includes signed-in identity and role", () => {
    expect(getAccountMenuButtonLabel("Casey Lee", "participant")).toBe(
      "Open account menu for Casey Lee. Signed in as Participant."
    );
  });

  it("falls back safely without a name", () => {
    expect(getAccountMenuButtonLabel("", "driver")).toBe(
      "Open account menu for account. Signed in as Driver."
    );
  });
});

describe("withAvatarCacheVersion", () => {
  it("returns null when there is no URL", () => {
    expect(withAvatarCacheVersion(null, new Date("2026-07-01T00:00:00Z"))).toBe(
      null
    );
  });

  it("appends a cache-busting version", () => {
    const updatedAt = new Date("2026-07-01T00:00:00.000Z");
    expect(withAvatarCacheVersion("/api/profile/avatar", updatedAt)).toBe(
      `/api/profile/avatar?v=${updatedAt.getTime()}`
    );
  });

  it("uses & when the URL already has a query string", () => {
    const updatedAt = new Date("2026-07-01T00:00:00.000Z");
    expect(
      withAvatarCacheVersion("/api/profile/avatar?x=1", updatedAt)
    ).toBe(`/api/profile/avatar?x=1&v=${updatedAt.getTime()}`);
  });
});

describe("getAccountMenuActions", () => {
  it("includes participant profile and settings links", () => {
    const actions = getAccountMenuActions("participant");
    expect(actions).toEqual(
      expect.arrayContaining([
        { href: "/dashboard/profile", label: "View profile" },
        {
          href: "/dashboard/settings/notifications",
          label: "Notification settings",
        },
        {
          href: "/dashboard/accessibility",
          label: "Accessibility preferences",
        },
      ])
    );
  });

  it("maps worker and driver profile routes", () => {
    expect(getAccountMenuActions("support_worker")).toEqual(
      expect.arrayContaining([
        { href: "/worker/profile", label: "View profile" },
      ])
    );
    expect(getAccountMenuActions("driver")).toEqual(
      expect.arrayContaining([{ href: "/driver/profile", label: "View profile" }])
    );
  });

  it("omits view profile when no role profile page exists", () => {
    const labels = getAccountMenuActions("mapable_admin").map((a) => a.label);
    expect(labels).not.toContain("View profile");
    expect(labels).toContain("Notification settings");
  });
});
