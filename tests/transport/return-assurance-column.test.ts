import { Prisma, type TransportTrip } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportTrip: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import {
  isMissingReturnAssuranceColumn,
  withNullReturnAssuranceStatus,
} from "@/lib/transport/transport-trip-service";

describe("isMissingReturnAssuranceColumn", () => {
  it("matches Prisma P2022 for returnAssuranceStatus", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "The column `transport_trips.returnAssuranceStatus` does not exist in the current database.",
      {
        code: "P2022",
        clientVersion: "6.19.2",
        meta: { column: "transport_trips.returnAssuranceStatus" },
      },
    );
    expect(isMissingReturnAssuranceColumn(error)).toBe(true);
  });

  it("ignores other Prisma errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError("not found", {
      code: "P2025",
      clientVersion: "6.19.2",
    });
    expect(isMissingReturnAssuranceColumn(error)).toBe(false);
  });

  it("restores omitted returnAssuranceStatus as null", () => {
    const omitted = { id: "trip_1" } as Omit<
      TransportTrip,
      "returnAssuranceStatus"
    >;
    const trip = withNullReturnAssuranceStatus(omitted);
    expect(trip.id).toBe("trip_1");
    expect(trip.returnAssuranceStatus).toBeNull();
  });
});
