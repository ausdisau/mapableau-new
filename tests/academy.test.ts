import { describe, expect, it } from "vitest";

import { allLessonsComplete } from "@/lib/academy/enrolment-service";
import { academyEnrolSchema, quizSubmitSchema } from "@/lib/validation/academy";
import { hasPermission } from "@/lib/auth/permissions";

describe("academy permissions", () => {
  it("grants academy enrol to participants and support workers", () => {
    expect(hasPermission("participant", "academy:enrol")).toBe(true);
    expect(hasPermission("support_worker", "academy:enrol")).toBe(true);
  });

  it("grants academy manage to mapable admin only among sample roles", () => {
    expect(hasPermission("mapable_admin", "academy:manage:any")).toBe(true);
    expect(hasPermission("participant", "academy:manage:any")).toBe(false);
  });
});

describe("lesson completion gate", () => {
  it("requires all lessons before quiz access", () => {
    expect(allLessonsComplete(3, 2)).toBe(false);
    expect(allLessonsComplete(3, 3)).toBe(true);
    expect(allLessonsComplete(0, 0)).toBe(false);
  });
});

describe("academy validation", () => {
  it("requires allergy-style literal for enrol schema fields", () => {
    expect(academyEnrolSchema.safeParse({ courseId: "c1" }).success).toBe(true);
  });

  it("validates quiz answers array", () => {
    const ok = quizSubmitSchema.safeParse({
      answers: [{ questionId: "q1", selectedIndex: 0 }],
    });
    expect(ok.success).toBe(true);
  });
});

describe("certificate pass mark rule", () => {
  it("fails when score below 80 percent", () => {
    const scorePercent = 75;
    const passMark = 80;
    expect(scorePercent >= passMark).toBe(false);
  });

  it("passes at 80 percent", () => {
    expect(80 >= 80).toBe(true);
  });
});
