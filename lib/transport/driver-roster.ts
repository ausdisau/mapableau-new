import type { TransportTripStatus } from "@prisma/client";
import { z } from "zod";

import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

import { stages } from "./driver-journey";
import { mobilityRequirementsSchema } from "./mobility-schema";
import {
  assertDriverEligible,
  assertVehicleEligible,
} from "./transport-eligibility-service";
import {
  countTripAssignmentRevisions,
  recordTripEvent,
} from "./transport-event-service";
import { assertStatusTransition } from "./transport-status-service";

export const driverPilotEnabled = () =>
  process.env.MAPABLE_DRIVER_FIELD_PILOT_ENABLED === "true";
export function isFieldDriver(user: CurrentUser) {
  return (
    user.primaryRole === "driver" &&
    hasPermission(user.primaryRole, "transport:drive")
  );
}
const validStages = stages.map((s) => s.id);
const confirmFields = ["vehicle", "plan", "communication", "rider"] as const;
export const fieldCommand = z.object({
  assignment: z.string().min(1).max(160),
  revision: z.string().datetime(),
  expected: z.enum(
    validStages as [(typeof validStages)[number], ...typeof validStages],
  ),
  kind: z.enum(["advance", "decline"]),
  confirmations: z.array(z.enum(confirmFields)).max(4),
});
type FieldCommand = z.infer<typeof fieldCommand>;
export function confirmStage(input: FieldCommand) {
  const need =
    input.expected === "pre_start_check_required"
      ? ["vehicle", "plan", "communication"]
      : ["arrived_at_pickup", "arrived_at_dropoff"].includes(input.expected)
        ? ["rider"]
        : [];
  return need.every((k) => input.confirmations.some((v) => v === k));
}
function inServiceWindow(start: Date, end: Date | null, now: Date) {
  // Use the booked window plus a short operational buffer. Historical trips stay masked.
  return (
    now.getTime() >= start.getTime() - 2 * 3600_000 &&
    now.getTime() <=
      (end?.getTime() ?? start.getTime() + 2 * 3600_000) + 2 * 3600_000
  );
}
export async function assignedRoster(user: CurrentUser, now = new Date()) {
  if (!isFieldDriver(user) || !driverPilotEnabled()) return [];
  const rows = await prisma.transportDispatchAssignment.findMany({
    where: {
      active: true,
      driver: { userId: user.id, active: true },
      vehicle: { active: true },
      trip: {
        status: { in: [...validStages] },
        OR: [
          {
            scheduledStart: {
              gte: new Date(now.getTime() - 24 * 3600_000),
              lte: new Date(now.getTime() + 7 * 24 * 3600_000),
            },
          },
          {
            status: {
              in: validStages.filter(
                (s) =>
                  s !== "driver_vehicle_assigned" && s !== "trip_completed",
              ),
            },
          },
        ],
      },
    },
    orderBy: [{ trip: { scheduledStart: "asc" } }, { id: "asc" }],
    take: 150,
    select: {
      id: true,
      organisationId: true,
      driver: { select: { organisationId: true } },
      vehicle: { select: { displayName: true, organisationId: true } },
      trip: {
        select: {
          status: true,
          updatedAt: true,
          scheduledStart: true,
          scheduledEnd: true,
          pickupSuburb: true,
          dropoffSuburb: true,
          pickupAddress: true,
          dropoffAddress: true,
          providerOrganisationId: true,
          participantId: true,
          tripRequest: {
            select: {
              quotes: {
                where: { status: "accepted", acceptedAt: { not: null } },
                select: { organisationId: true, participantUserId: true },
              },
            },
          },
        },
      },
    },
  });
  return rows
    .filter(
      (r) =>
        r.organisationId === r.driver?.organisationId &&
        r.organisationId === r.vehicle?.organisationId &&
        r.organisationId === r.trip.providerOrganisationId,
    )
    .map((r) => {
      const t = r.trip;
      const hasQuote =
        t.tripRequest?.quotes.some(
          (q) =>
            q.organisationId === r.organisationId &&
            q.participantUserId === t.participantId,
        ) === true;
      const exact =
        t.status !== "driver_vehicle_assigned" &&
        t.status !== "trip_completed" &&
        hasQuote &&
        inServiceWindow(t.scheduledStart, t.scheduledEnd, now);
      return {
        assignment: r.id,
        revision: t.updatedAt.toISOString(),
        status: t.status,
        scheduled: t.scheduledStart.toISOString(),
        vehicle: r.vehicle!.displayName,
        from: exact
          ? t.pickupAddress
          : (t.pickupSuburb ?? "Pickup area withheld"),
        to: exact
          ? t.dropoffAddress
          : (t.dropoffSuburb ?? "Destination area withheld"),
        exact,
      };
    });
}
class FieldConflict extends Error {}
const conflict = () =>
  new FieldConflict(
    "The assignment changed. Refresh the roster to see its current status.",
  );
export const isFieldConflict = (e: unknown) => e instanceof FieldConflict;
export async function changeAssignedTrip(
  user: CurrentUser,
  input: FieldCommand,
) {
  if (!driverPilotEnabled() || !isFieldDriver(user))
    throw new FieldConflict("Driver access is unavailable.");
  if (!confirmStage(input))
    throw new FieldConflict("Complete the confirmations for this stage.");
  // Locate the trip through the caller’s active assignment. Revalidate after acquiring the same trip lock as dispatch.
  const scoped = {
    id: input.assignment,
    active: true,
    driver: { userId: user.id, active: true },
    vehicle: { active: true },
  };
  const link = await prisma.transportDispatchAssignment.findFirst({
    where: scoped,
    select: { tripId: true },
  });
  if (!link) throw conflict();
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM transport_trips WHERE id = ${link.tripId} FOR UPDATE`;
      const a = await tx.transportDispatchAssignment.findFirst({
        where: { ...scoped, tripId: link.tripId },
        include: { trip: true, driver: true, vehicle: true },
      });
      if (
        !a?.driver ||
        !a.vehicle ||
        a.organisationId !== a.trip.providerOrganisationId ||
        a.driver.organisationId !== a.organisationId ||
        a.vehicle.organisationId !== a.organisationId ||
        a.trip.status !== input.expected ||
        a.trip.updatedAt.toISOString() !== input.revision
      )
        throw conflict();
      const activeCount = await tx.transportDispatchAssignment.count({
        where: { tripId: a.tripId, active: true },
      });
      if (activeCount !== 1) throw conflict();
      const step = stages.findIndex((s) => s.id === a.trip.status);
      let next: TransportTripStatus;
      let eventType = "driver_status";
      const metadata: Record<string, unknown> = {};
      if (input.kind === "decline") {
        if (a.trip.status !== "driver_vehicle_assigned") throw conflict();
        next = "dispatch_pending";
        eventType = "driver_rejected";
        await tx.transportDispatchAssignment.update({
          where: { id: a.id },
          data: { active: false, unassignedAt: new Date() },
        });
        metadata.revokePriorRoomGrants = true;
        metadata.roomGrantGeneration =
          (await countTripAssignmentRevisions(a.tripId, tx)) + 1;
      } else {
        const target = stages[step + 1];
        if (step < 0 || !target) throw conflict();
        next = target.id;
        assertStatusTransition(a.trip.status, next, {
          driverOnly: a.trip.status !== "driver_vehicle_assigned",
        });
        if (next === "driver_accepted" || next === "en_route_to_pickup") {
          const mobility = mobilityRequirementsSchema.safeParse(
            a.trip.mobilityRequirements,
          );
          if (!mobility.success)
            throw new FieldConflict(
              "Dispatch must review the recorded trip requirements.",
            );
          const requirements = mobility.data;
          await assertDriverEligible(a.driver.id, requirements);
          await assertVehicleEligible(a.vehicle.id, requirements);
        }
        if (next === "driver_accepted") eventType = "driver_accepted";
        if (next === "en_route_to_pickup")
          await tx.transportSafetyCheck.create({
            data: {
              tripId: a.tripId,
              checkType: "pre_start",
              passed: true,
              actorUserId: user.id,
            },
          });
        if (next === "participant_boarded" || next === "handover_completed")
          await tx.transportHandoverRecord.create({
            data: {
              tripId: a.tripId,
              completed: true,
              actorUserId: user.id,
              notes: next === "participant_boarded" ? "pickup" : "dropoff",
            },
          });
      }
      const changed = await tx.transportTrip.updateMany({
        where: {
          id: a.tripId,
          status: a.trip.status,
          updatedAt: a.trip.updatedAt,
        },
        data: { status: next },
      });
      if (changed.count !== 1) throw conflict();
      await recordTripEvent({
        tripId: a.tripId,
        actorUserId: user.id,
        eventType,
        fromStatus: a.trip.status,
        toStatus: next,
        participantId: a.trip.participantId,
        organisationId: a.organisationId,
        metadata,
        tx,
      });
    },
    { isolationLevel: "Serializable", timeout: 15000 },
  );
}
