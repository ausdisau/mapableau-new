import { describe, expect, it } from "vitest";

import { isOperationalWorkerPermission } from "@/lib/workers/worker-org-access";

describe("worker-org-access", () => {
  it("identifies operational worker permissions", () => {
    expect(isOperationalWorkerPermission("care:shift:work")).toBe(true);
    expect(isOperationalWorkerPermission("timesheet:manage:org")).toBe(true);
    expect(isOperationalWorkerPermission("profile:read:self")).toBe(false);
  });
});
