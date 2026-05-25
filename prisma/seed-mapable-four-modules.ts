import { PrismaClient, type MapAbleUserRole } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD_HASH =
  "$2b$10$iLyIbD98gF/4Wnghy5CnY.m4JK0/bL8CLbc/pUtnQ/nXr4Wuep.8O";

/**
 * Seed demo data for MapAble Four Modules feature set.
 * Fictional characters only — Alex Rivers, Jamie Rivers, Morgan Lee, etc.
 */
export async function seedMapAbleFourModules() {
  console.log("Seeding MapAble Four Modules demo data...");

  const users: Record<string, string> = {};

  const defs: { name: string; email: string; primaryRole: MapAbleUserRole }[] = [
    { name: "Alex Rivers", email: "alex.rivers@mapable.test", primaryRole: "participant" },
    { name: "Jamie Rivers", email: "jamie.rivers@mapable.test", primaryRole: "family_member" },
    { name: "Morgan Lee", email: "morgan.lee@mapable.test", primaryRole: "support_coordinator" },
    { name: "BrightPath Plan Management", email: "planmanager@mapable.test", primaryRole: "plan_manager" },
    { name: "Taylor Chen", email: "taylor.chen@mapable.test", primaryRole: "provider_admin" },
  ];

  for (const u of defs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: PASSWORD_HASH,
        primaryRole: u.primaryRole,
      },
      update: { name: u.name, primaryRole: u.primaryRole, passwordHash: PASSWORD_HASH },
    });
    users[u.email] = user.id;
    await prisma.userRoleAssignment.upsert({
      where: { userId_role: { userId: user.id, role: u.primaryRole } },
      create: { userId: user.id, role: u.primaryRole, isPrimary: true },
      update: { isPrimary: true },
    });
  }

  const participantId = users["alex.rivers@mapable.test"];
  const nomineeId = users["jamie.rivers@mapable.test"];
  const coordinatorId = users["morgan.lee@mapable.test"];
  const planManagerId = users["planmanager@mapable.test"];
  const assessorId = users["taylor.chen@mapable.test"];

  await prisma.participantProfile.upsert({
    where: { userId: participantId },
    create: {
      userId: participantId,
      displayName: "Alex Rivers",
      preferredName: "Alex",
      homeSuburb: "Brunswick",
      homeState: "VIC",
    },
    update: {},
  });

  // Scenario 1: Active support coordinator consent
  await prisma.supportCoordinatorRelationship.upsert({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
    create: {
      participantId,
      coordinatorId,
      status: "active",
      scopesJson: ["profile.read", "bookings.read", "referrals.manage"],
    },
    update: { status: "active" },
  });

  await prisma.supportCoordinatorProfile.upsert({
    where: { userId: coordinatorId },
    create: {
      userId: coordinatorId,
      displayName: "Morgan Lee",
      bio: "Demo support coordinator — fictional data.",
      regions: ["Melbourne Metro"],
      verificationStatus: "verified",
    },
    update: {},
  });

  await prisma.goalProgressUpdate.create({
    data: {
      participantId,
      coordinatorId,
      goalTitle: "Increase community participation",
      progressPct: 45,
      notes: "Attending local accessible events monthly.",
    },
  });

  // Scenario 2: Nominee permissions
  await prisma.nomineeProfile.upsert({
    where: { userId: nomineeId },
    create: {
      userId: nomineeId,
      displayName: "Jamie Rivers",
      relationship: "Sibling / family supporter",
    },
    update: {},
  });

  const nomineeLink = await prisma.participantNomineeLink.upsert({
    where: { participantId_nomineeId: { participantId, nomineeId } },
    create: {
      participantId,
      nomineeId,
      status: "active",
      invitedById: participantId,
      acceptedAt: new Date(),
    },
    update: { status: "active" },
  });

  for (const scope of ["view_dashboard", "view_bookings", "approve_invoice", "create_booking_draft"] as const) {
    await prisma.nomineePermission.upsert({
      where: { linkId_scope: { linkId: nomineeLink.id, scope } },
      create: { linkId: nomineeLink.id, scope },
      update: { revokedAt: null },
    });
  }

  // Scenario 3: Plan manager linked invoices
  await prisma.planManagerRelationship.upsert({
    where: { participantId_planManagerId: { participantId, planManagerId } },
    create: { participantId, planManagerId, status: "active" },
    update: { status: "active" },
  });

  await prisma.planManagerProfile.upsert({
    where: { userId: planManagerId },
    create: {
      userId: planManagerId,
      displayName: "BrightPath Plan Management",
      contactEmail: "planmanager@mapable.test",
      verificationStatus: "verified",
    },
    update: {},
  });

  const hmOrg = await prisma.organisation.upsert({
    where: { id: "seed-accessbuild-org" },
    create: {
      id: "seed-accessbuild-org",
      name: "AccessBuild Demo Co",
      organisationType: "care_provider",
      contactEmail: "accessbuild@demo.mapable.test",
      verificationStatus: "verified",
      serviceRegions: ["Melbourne Metro"],
    },
    update: {},
  });

  await prisma.homeModificationProviderProfile.upsert({
    where: { organisationId: hmOrg.id },
    create: {
      organisationId: hmOrg.id,
      displayName: "AccessBuild Demo Co",
      specialisations: ["ramps", "bathroom_modifications", "door_widening"],
      regions: ["Melbourne Metro"],
      verificationStatus: "verified",
    },
    update: {},
  });

  const everydayOrg = await prisma.organisation.upsert({
    where: { id: "seed-everyday-access-org" },
    create: {
      id: "seed-everyday-access-org",
      name: "Everyday Access Supports",
      organisationType: "care_provider",
      contactEmail: "everyday@demo.mapable.test",
      verificationStatus: "verified",
    },
    update: {},
  });

  const invoice = await prisma.invoice.create({
    data: {
      participantId,
      organisationId: everydayOrg.id,
      status: "approved_for_invoicing",
      subtotalCents: 25000,
      totalCents: 25000,
      createdById: participantId,
      lines: {
        create: {
          description: "Support coordination session",
          serviceDate: new Date(),
          quantity: 1,
          unitAmountCents: 25000,
          totalAmountCents: 25000,
          supportItemCode: "07_001_0106_8_3",
          claimableByNdis: true,
        },
      },
    },
  });

  await prisma.planManagerInvoiceInbox.upsert({
    where: {
      invoiceId_planManagerId: { invoiceId: invoice.id, planManagerId },
    },
    create: {
      invoiceId: invoice.id,
      planManagerId,
      participantId,
      status: "pending",
      claimWarnings: ["Review NDIS line item before processing."],
    },
    update: {},
  });

  // Scenario 4–6: Home modification request, quote, project milestones
  const hmRequest = await prisma.homeModificationRequest.create({
    data: {
      participantId,
      title: "Bathroom accessibility upgrade",
      description: "Wheelchair-accessible shower and grab rails.",
      addressSummary: "Brunswick, VIC",
      status: "quotes_requested",
      fundingNotes: "May require OT report. Funding approval not guaranteed.",
    },
  });

  await prisma.homeModificationDocument.create({
    data: {
      requestId: hmRequest.id,
      participantId,
      uploadedById: participantId,
      fileName: "bathroom-photo-placeholder.jpg",
      documentType: "photo",
      visibility: "private_to_participant",
    },
  });

  const providerUser = await prisma.user.findFirst({
    where: { primaryRole: "provider_admin" },
  });

  await prisma.homeModificationQuote.create({
    data: {
      requestId: hmRequest.id,
      providerId: providerUser?.id ?? assessorId,
      organisationId: hmOrg.id,
      title: "AccessBuild bathroom quote",
      totalCents: 1850000,
      status: "received",
      breakdownJson: [
        { item: "Shower modification", amountCents: 1200000 },
        { item: "Grab rails & fixtures", amountCents: 350000 },
        { item: "Labour", amountCents: 300000 },
      ],
    },
  });

  const project = await prisma.homeModificationProject.create({
    data: {
      requestId: hmRequest.id,
      participantId,
      providerId: providerUser?.id ?? assessorId,
      title: "Bathroom accessibility upgrade",
      status: "installation",
      fundingNotes: "Guidance only — not funding approval.",
    },
  });

  const milestones = [
    { title: "Assessment booked", sortOrder: 0, status: "completed" as const },
    { title: "Quote accepted", sortOrder: 1, status: "completed" as const },
    { title: "Installation scheduled", sortOrder: 2, status: "in_progress" as const },
  ];

  for (const m of milestones) {
    await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        title: m.title,
        sortOrder: m.sortOrder,
        status: m.status,
        ...(m.status === "completed" ? { completedAt: new Date() } : {}),
      },
    });
  }

  await prisma.homeModificationAssessment.create({
    data: {
      requestId: hmRequest.id,
      assessorId,
      scheduledAt: new Date(Date.now() + 86400000 * 14),
      status: "scheduled",
      notes: "OT/access assessment with Taylor Chen",
    },
  });

  console.log("MapAble Four Modules seed complete.");
  return {
    participantId,
    nomineeId,
    coordinatorId,
    planManagerId,
    projectId: project.id,
    invoiceId: invoice.id,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedMapAbleFourModules()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
