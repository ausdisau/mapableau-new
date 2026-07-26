import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";

/**
 * Internal realtime room-membership verifier.
 *
 * Called by `apps/realtime-server` before `socket.join` on trip_*/care_* rooms.
 * Authenticated via shared bearer `REALTIME_ROOM_ACCESS_TOKEN` (fail closed).
 */

const ADMIN_ROLES = new Set([
  "mapable_admin",
  "admin",
  "platform_admin",
]);

function safeEqualToken(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function authorizeService(request: Request): boolean {
  const expected = process.env.REALTIME_ROOM_ACCESS_TOKEN?.trim();
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  return safeEqualToken(match[1].trim(), expected);
}

type Body = {
  userId?: string;
  userRole?: string;
  roomId?: string;
  resourceType?: "trip" | "care";
  resourceId?: string;
};

export async function POST(request: Request) {
  // SECURITY: service-to-service only — never expose without the shared secret.
  if (!authorizeService(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const userRole = body.userRole?.trim() || "participant";
  const resourceType = body.resourceType;
  const resourceId = body.resourceId?.trim();

  if (!userId || !resourceType || !resourceId) {
    return NextResponse.json(
      { allowed: false, reason: "invalid_request" },
      { status: 200 },
    );
  }

  if (resourceType === "trip") {
    const trip = await prisma.transportBooking.findUnique({
      where: { id: resourceId },
      select: {
        participantId: true,
        driverProfile: { select: { userId: true } },
      },
    });

    if (!trip) {
      return NextResponse.json({
        allowed: false,
        reason: "trip_not_found",
      });
    }

    if (ADMIN_ROLES.has(userRole)) {
      return NextResponse.json({ allowed: true, reason: "admin" });
    }

    const isParticipant = trip.participantId === userId;
    const isDriver = trip.driverProfile?.userId === userId;
    return NextResponse.json({
      allowed: isParticipant || isDriver,
      reason: isParticipant
        ? "trip_participant"
        : isDriver
          ? "trip_driver"
          : "trip_not_member",
    });
  }

  if (resourceType === "care") {
    const care = await prisma.careBooking.findUnique({
      where: { id: resourceId },
      select: {
        participantId: true,
        bookingWorkers: {
          where: { active: true },
          select: { workerProfile: { select: { userId: true } } },
        },
      },
    });

    if (!care) {
      return NextResponse.json({
        allowed: false,
        reason: "care_not_found",
      });
    }

    if (ADMIN_ROLES.has(userRole)) {
      return NextResponse.json({ allowed: true, reason: "admin" });
    }

    const isParticipant = care.participantId === userId;
    const isWorker = care.bookingWorkers.some(
      (w) => w.workerProfile.userId === userId,
    );
    return NextResponse.json({
      allowed: isParticipant || isWorker,
      reason: isParticipant
        ? "care_participant"
        : isWorker
          ? "care_worker"
          : "care_not_member",
    });
  }

  return NextResponse.json({
    allowed: false,
    reason: "unknown_resource_type",
  });
}
