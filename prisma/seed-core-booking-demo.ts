import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedCoreBookingDemo() {
  const passwordHash = await bcrypt.hash("demo-password-change-me", 10);

  const participant = await prisma.user.upsert({
    where: { email: "demo.participant@mapable.local" },
    create: {
      name: "Demo Participant",
      email: "demo.participant@mapable.local",
      passwordHash,
      primaryRole: "participant",
    },
    update: {},
  });

  const nominee = await prisma.user.upsert({
    where: { email: "demo.nominee@mapable.local" },
    create: {
      name: "Demo Nominee",
      email: "demo.nominee@mapable.local",
      passwordHash,
      primaryRole: "family_member",
    },
    update: {},
  });

  const careOrg = await prisma.organisation.upsert({
    where: { id: "demo-care-org" },
    create: {
      id: "demo-care-org",
      name: "Demo Care Provider",
      organisationType: "care_provider",
      verificationStatus: "verified",
    },
    update: {},
  });

  const transportOrg = await prisma.organisation.upsert({
    where: { id: "demo-transport-org" },
    create: {
      id: "demo-transport-org",
      name: "Demo Transport Provider",
      organisationType: "transport_provider",
      verificationStatus: "verified",
    },
    update: {},
  });

  const providerAdmin = await prisma.user.upsert({
    where: { email: "demo.provider@mapable.local" },
    create: {
      name: "Demo Provider Admin",
      email: "demo.provider@mapable.local",
      passwordHash,
      primaryRole: "provider_admin",
    },
    update: {},
  });

  await prisma.organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: providerAdmin.id,
        organisationId: careOrg.id,
      },
    },
    create: {
      userId: providerAdmin.id,
      organisationId: careOrg.id,
      role: "provider_admin",
    },
    update: {},
  });

  const workers = await Promise.all(
    [1, 2, 3].map((i) =>
      prisma.user.upsert({
        where: { email: `demo.worker${i}@mapable.local` },
        create: {
          name: `Demo Worker ${i}`,
          email: `demo.worker${i}@mapable.local`,
          passwordHash,
          primaryRole: "support_worker",
        },
        update: {},
      })
    )
  );

  for (const w of workers) {
    await prisma.organisationMember.upsert({
      where: {
        userId_organisationId: { userId: w.id, organisationId: careOrg.id },
      },
      create: {
        userId: w.id,
        organisationId: careOrg.id,
        role: "support_worker",
      },
      update: {},
    });
  }

  const start = new Date();
  start.setDate(start.getDate() + 3);

  const careBooking = await prisma.booking.create({
    data: {
      participantId: participant.id,
      bookingType: "care",
      status: "awaiting_provider_acceptance",
      requestedStart: start,
      assignedOrganisationId: careOrg.id,
      createdById: participant.id,
      title: "Demo care booking",
      accessibilitySummary: "Wheelchair access",
    },
  });

  const transportBooking = await prisma.booking.create({
    data: {
      participantId: participant.id,
      bookingType: "transport",
      status: "confirmed",
      requestedStart: start,
      assignedOrganisationId: transportOrg.id,
      createdById: participant.id,
      pickupAddress: "1 Demo St",
      dropoffAddress: "2 Support Ave",
    },
  });

  const combinedBooking = await prisma.booking.create({
    data: {
      participantId: participant.id,
      bookingType: "care_transport",
      status: "completed",
      requestedStart: start,
      assignedOrganisationId: careOrg.id,
      assignedWorkerId: workers[0].id,
      createdById: participant.id,
      actualStartAt: start,
      actualEndAt: new Date(start.getTime() + 2 * 60 * 60 * 1000),
    },
  });

  for (const b of [careBooking, transportBooking, combinedBooking]) {
    await prisma.conversation.create({
      data: {
        type: "booking_thread",
        title: `Booking thread ${b.id.slice(0, 6)}`,
        bookingId: b.id,
        participantId: participant.id,
        organisationId: b.assignedOrganisationId,
        createdById: participant.id,
        participants: {
          create: [
            { userId: participant.id, roleInThread: "participant" },
            { userId: providerAdmin.id, roleInThread: "provider_admin" },
          ],
        },
        messages: {
          create: {
            senderUserId: providerAdmin.id,
            body: "Demo system message for booking thread.",
            isSystemMessage: true,
          },
        },
      },
    });
  }

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-DEMO-DRAFT",
      participantId: participant.id,
      organisationId: careOrg.id,
      bookingId: combinedBooking.id,
      status: "draft",
      subtotalCents: 15000,
      taxCents: 0,
      totalCents: 15000,
      ndisClaimableCents: 12000,
      participantGapCents: 3000,
      createdById: providerAdmin.id,
      lines: {
        create: {
          description: "Demo support line",
          serviceDate: start,
          quantity: 1,
          unitAmountCents: 15000,
          totalAmountCents: 15000,
          claimableByNdis: true,
        },
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-DEMO-ISSUED",
      participantId: participant.id,
      organisationId: careOrg.id,
      status: "issued",
      issuedAt: new Date(),
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      subtotalCents: 8000,
      totalCents: 8000,
      createdById: providerAdmin.id,
      lines: {
        create: {
          description: "Issued demo line",
          serviceDate: start,
          quantity: 1,
          unitAmountCents: 8000,
          totalAmountCents: 8000,
        },
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-DEMO-PAID",
      participantId: participant.id,
      organisationId: careOrg.id,
      bookingId: transportBooking.id,
      status: "paid",
      paidAt: new Date(),
      subtotalCents: 5000,
      totalCents: 5000,
      createdById: providerAdmin.id,
      lines: {
        create: {
          description: "Paid transport demo",
          serviceDate: start,
          quantity: 1,
          unitAmountCents: 5000,
          totalAmountCents: 5000,
        },
      },
    },
  });

  await prisma.booking.update({
    where: { id: transportBooking.id },
    data: { status: "paid" },
  });

  console.log("Core booking demo seed:", {
    participant: participant.email,
    nominee: nominee.email,
    providerAdmin: providerAdmin.email,
  });
}
