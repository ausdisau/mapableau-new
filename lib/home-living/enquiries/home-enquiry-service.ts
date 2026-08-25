import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import { prisma } from "@/lib/prisma";

export class HomeEnquiriesDisabledError extends Error {
  constructor() {
    super("HOME_ENQUIRIES_DISABLED");
    this.name = "HomeEnquiriesDisabledError";
  }
}

function assertEnquiriesEnabled() {
  if (
    !homeLivingConfig.enabled ||
    !homeLivingConfig.discoveryEnabled ||
    !homeLivingConfig.enquiriesEnabled
  ) {
    throw new HomeEnquiriesDisabledError();
  }
}

const ENQUIRY_KINDS = [
  "basic",
  "inspection",
  "accessibility_question",
] as const;

export type HomeEnquiryKind = (typeof ENQUIRY_KINDS)[number];

/**
 * Housing enquiry via MapAble messaging.
 * Never attaches the full HomeLivingProfile unless keys are explicitly shared.
 */
export async function createHomeEnquiry(input: {
  participantId: string;
  actorUserId: string;
  propertyId: string;
  enquiryKind?: HomeEnquiryKind;
  messageBody: string;
  sharedRequirementKeys?: string[];
}) {
  assertEnquiriesEnabled();
  const kind = input.enquiryKind ?? "basic";
  if (!ENQUIRY_KINDS.includes(kind)) {
    throw new Error("INVALID_ENQUIRY_KIND");
  }
  const sharedKeys = [...new Set(input.sharedRequirementKeys ?? [])].slice(
    0,
    20,
  );
  if (input.messageBody.trim().length < 5) {
    throw new Error("MESSAGE_TOO_SHORT");
  }

  const property = await prisma.accessibleProperty.findFirst({
    where: {
      id: input.propertyId,
      deletedAt: null,
      listingStatus: "published",
    },
  });
  if (!property) throw new Error("PROPERTY_NOT_FOUND");

  const result = await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        type: "participant_provider",
        title: `Home enquiry: ${property.title}`,
        participantId: input.participantId,
        organisationId: property.providerOrganisationId,
        createdById: input.actorUserId,
        lastMessageAt: new Date(),
        participants: {
          create: [{ userId: input.actorUserId }],
        },
        messages: {
          create: {
            senderUserId: input.actorUserId,
            body: input.messageBody.trim(),
          },
        },
      },
    });

    const enquiry = await tx.homeEnquiry.create({
      data: {
        propertyId: property.id,
        participantId: input.participantId,
        organisationId: property.providerOrganisationId,
        conversationId: conversation.id,
        enquiryKind: kind,
        sharedRequirementKeys: sharedKeys,
      },
    });

    return { conversation, enquiry };
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    organisationId: property.providerOrganisationId,
    action: "home.enquiry.created",
    entityType: "HomeEnquiry",
    entityId: result.enquiry.id,
    metadata: {
      propertyId: property.id,
      enquiryKind: kind,
      sharedRequirementKeyCount: sharedKeys.length,
      fullProfileShared: false,
    },
  });

  if (sharedKeys.length > 0) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      organisationId: property.providerOrganisationId,
      action: "home.requirements.shared",
      entityType: "HomeEnquiry",
      entityId: result.enquiry.id,
      metadata: { sharedRequirementKeys: sharedKeys },
    });
  }

  return result;
}

export async function listParticipantHomeEnquiries(participantId: string) {
  assertEnquiriesEnabled();
  return prisma.homeEnquiry.findMany({
    where: { participantId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          suburb: true,
          state: true,
          listingStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
