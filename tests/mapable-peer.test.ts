import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import { hasPermission } from "@/lib/auth/permissions";
import { PeerAccessError } from "@/lib/peer/access-control";
import { resolvePublicDisplayName } from "@/lib/peer/dto";
import { initialPostStatus, scanPeerContent } from "@/lib/peer/content-scanner";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantProfile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn(),
}));

describe("Peer permissions", () => {
  it("allows participant peer access", () => {
    expect(hasPermission("participant", "peer:access")).toBe(true);
  });

  it("allows peer mentor manage self", () => {
    expect(hasPermission("peer_mentor", "peer:mentor:manage:self")).toBe(true);
  });

  it("denies coordinator peer admin by default", () => {
    expect(hasPermission("support_coordinator", "peer:admin")).toBe(false);
  });
});

describe("display name privacy", () => {
  it("hides real name for anonymous public", () => {
    const name = resolvePublicDisplayName(
      { displayName: "RiverAlias", displayNameMode: "anonymous_public" },
      { name: "Jane Citizen" }
    );
    expect(name).toBe("Community member");
    expect(name).not.toContain("Jane");
  });

  it("uses alias for community_alias mode", () => {
    const name = resolvePublicDisplayName(
      { displayName: "RiverAlias", displayNameMode: "community_alias" },
      { name: "Jane Citizen" }
    );
    expect(name).toBe("RiverAlias");
  });
});

describe("content scanner", () => {
  it("queues crisis language", () => {
    const scan = scanPeerContent("I want to hurt myself tonight");
    expect(scan.shouldQueue).toBe(true);
    expect(scan.flags).toContain("self_harm_or_crisis");
    expect(initialPostStatus(scan)).toBe("pending_moderation");
  });

  it("allows benign peer sharing", () => {
    const scan = scanPeerContent("I found a quiet cafe with step-free entry.");
    expect(scan.shouldQueue).toBe(false);
    expect(initialPostStatus(scan)).toBe("published");
  });
});

describe("mentor participant record boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks mentor without care consent when participant profile exists", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { checkConsent } = await import("@/lib/consent/consent-service");
    const { assertMentorCannotAccessParticipantRecords } = await import(
      "@/lib/peer/access-control"
    );

    vi.mocked(prisma.participantProfile.findUnique).mockResolvedValue({
      id: "pp1",
      ndisParticipantNumberEnc: null,
    } as never);
    vi.mocked(checkConsent).mockResolvedValue(false);

    await expect(
      assertMentorCannotAccessParticipantRecords("mentor1", "participant1")
    ).rejects.toMatchObject({ code: "MENTOR_PARTICIPANT_RECORDS_FORBIDDEN" });
  });

  it("allows when no participant profile", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { assertMentorCannotAccessParticipantRecords } = await import(
      "@/lib/peer/access-control"
    );

    vi.mocked(prisma.participantProfile.findUnique).mockResolvedValue(null);

    await expect(
      assertMentorCannotAccessParticipantRecords("mentor1", "user2")
    ).resolves.toBeUndefined();
  });
});

describe("no social media mechanics in peer components", () => {
  const banned = [
    "FollowButton",
    "FollowerCount",
    "LikeCount",
    "PublicLike",
    "followerCount",
    "likeCount",
  ];

  function walkDir(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) files.push(...walkDir(p));
      else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(p);
      }
    }
    return files;
  }

  it("has no follower or public like components under components/peer", () => {
    const root = join(process.cwd(), "components/peer");
    const contents = walkDir(root).map((f) => readFileSync(f, "utf8")).join("\n");
    for (const term of banned) {
      expect(contents).not.toContain(term);
    }
  });
});

describe("support coordinator peer activity", () => {
  it("does not grant peer access by default role permissions", () => {
    expect(hasPermission("support_coordinator", "peer:access")).toBe(false);
  });
});

describe("PeerAccessError", () => {
  it("uses consent required code", () => {
    const err = new PeerAccessError("test", "PEER_CONSENT_REQUIRED");
    expect(err.code).toBe("PEER_CONSENT_REQUIRED");
  });
});
