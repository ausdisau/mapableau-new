import { beforeEach, describe, expect, it } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { createCoverageCareEnquiry } from "@/lib/coverage-care/enquiry-service";
import { listCoverageCareServices } from "@/lib/coverage-care/listing-service";
import {
  assertEnquiryParticipant,
  CoverageCarePermissionError,
} from "@/lib/coverage-care/permissions";
import { resetCoverageCareMemoryStore } from "@/lib/coverage-care/store/memory-store";

const participant: CurrentUser = {
  id: "user_participant_1",
  email: "p@example.com",
  name: "Pat",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const platformAdmin: CurrentUser = {
  id: "user_mapable_admin",
  email: "admin@mapable.example",
  name: "MapAble Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "mapable_admin",
  roles: ["mapable_admin"],
};

describe("Coverage Care permissions", () => {
  beforeEach(() => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    process.env.MAPABLE_COVERAGE_CARE_PERSISTENCE = "memory";
    resetCoverageCareMemoryStore();
  });

  it("does not let platform admin own participant enquiries", () => {
    const listing = listCoverageCareServices()[0]!;
    const enquiry = createCoverageCareEnquiry({
      participant,
      listingId: listing.id,
    });

    expect(() => assertEnquiryParticipant(platformAdmin, enquiry)).toThrow(
      CoverageCarePermissionError,
    );
  });
});
