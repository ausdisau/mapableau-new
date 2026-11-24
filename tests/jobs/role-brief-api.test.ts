import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  tx: { job: { create: vi.fn() } },
  transaction: vi.fn(),
  organisation: vi.fn(),
  scope: vi.fn(),
  audit: vi.fn(),
  config: { enabled: true },
}));
vi.mock("@/lib/api/auth-handler", () => ({
  requireApiPermission: vi.fn(async () => ({
    id: "employer",
    primaryRole: "employer",
  })),
  requireApiSession: vi.fn(async () => ({
    id: "employer",
    primaryRole: "employer",
  })),
}));
vi.mock("@/lib/api/organisation-scope", () => ({
  organisationScopedIds: f.scope,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: f.transaction,
    organisation: { findFirst: f.organisation },
  },
}));
vi.mock("@/lib/config/jobs-participation", () => ({
  jobsParticipationConfig: f.config,
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: f.audit,
}));
vi.mock("@/lib/notifications/notification-service", () => ({
  notifyUser: vi.fn(),
}));

import { POST } from "@/app/api/jobs/route";
import type { CurrentUser } from "@/lib/auth/current-user";
import { readableJobs } from "@/lib/jobs/role-brief";

const draft = {
  employerOrganisationId: "radio",
  title: "Radio producer",
  description: "Plan a weekly programme.",
  employmentType: "part_time",
};
function post(extra: Record<string, unknown> = {}) {
  return POST(
    new Request("https://mapable.test/api/jobs", {
      method: "POST",
      body: JSON.stringify({ ...draft, ...extra }),
    }),
  );
}

describe("employer role briefs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    f.config.enabled = true;
    f.scope.mockResolvedValue(["radio"]);
    f.organisation.mockResolvedValue({ id: "radio" });
    f.tx.job.create.mockResolvedValue({ id: "job" });
    f.transaction.mockImplementation((run) => run(f.tx));
  });
  it("saves ordered skills and the audit event in the draft transaction", async () => {
    const res = await post({
      skills: [
        { label: " Plan episodes ", isEssential: true },
        { label: "Edit audio", isEssential: false },
      ],
      applicationInstructions: "Send a written outline.",
    });
    expect(res.status).toBe(201);
    expect(f.organisation).toHaveBeenCalledWith({
      where: { id: "radio", status: "active", AND: { id: { in: ["radio"] } } },
      select: { id: true },
    });
    expect(f.tx.job.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdById: "employer",
        status: "draft",
        applicationInstructions: "Send a written outline.",
        requirements: {
          create: [
            {
              category: "skill",
              label: "Plan episodes",
              isEssential: true,
              sortOrder: 0,
            },
            {
              category: "skill",
              label: "Edit audio",
              isEssential: false,
              sortOrder: 1,
            },
          ],
        },
      }),
    });
    expect(f.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        tx: f.tx,
        entityId: "job",
        action: "job.created",
      }),
    );
  });
  it("rejects repeated or oversized skills before creating any draft", async () => {
    const duplicate = await post({
      skills: [
        { label: "Edit  audio", isEssential: false },
        { label: "EDIT AUDIO", isEssential: true },
      ],
    });
    expect(duplicate.status).toBe(400);
    const excessive = await post({
      skills: Array.from({ length: 13 }, (_, n) => ({
        label: String(n),
        isEssential: false,
      })),
    });
    expect(excessive.status).toBe(400);
    expect(f.transaction).not.toHaveBeenCalled();
  });
  it("preserves ordinary drafts when skills participation is off", async () => {
    f.config.enabled = false;
    expect(
      (await post({ skills: [{ label: "Record audio", isEssential: true }] }))
        .status,
    ).toBe(403);
    expect((await post()).status).toBe(201);
    expect(f.tx.job.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ requirements: undefined }),
    });
  });
  it("requires an active organisation in the employer’s scope", async () => {
    f.organisation.mockResolvedValue(null);
    expect((await post()).status).toBe(403);
    expect(f.transaction).not.toHaveBeenCalled();
  });
  it("limits historical candidate access to their own applications", async () => {
    f.scope.mockResolvedValue([]);
    const where = await readableJobs({
      id: "reader",
      primaryRole: "participant",
    } as CurrentUser);
    expect(where.OR).toEqual([
      { status: "published" },
      { employerOrganisation: { id: { in: [] } } },
      {
        status: { in: ["closed", "archived"] },
        applications: { some: { participantId: "reader" } },
      },
    ]);
  });
});
