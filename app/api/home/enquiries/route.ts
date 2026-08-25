import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  createHomeEnquiry,
  HomeEnquiriesDisabledError,
  listParticipantHomeEnquiries,
} from "@/lib/home-living/enquiries/home-enquiry-service";

export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (
    !homeLivingConfig.enabled ||
    !homeLivingConfig.discoveryEnabled ||
    !homeLivingConfig.enquiriesEnabled
  ) {
    return jsonError("Home enquiries are disabled", 404);
  }
  try {
    const enquiries = await listParticipantHomeEnquiries(user.id);
    return jsonOk({ enquiries });
  } catch (error) {
    if (error instanceof HomeEnquiriesDisabledError) {
      return jsonError("Home enquiries are disabled", 404);
    }
    return jsonError("Unable to load enquiries", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  if (
    !homeLivingConfig.enabled ||
    !homeLivingConfig.discoveryEnabled ||
    !homeLivingConfig.enquiriesEnabled
  ) {
    return jsonError("Home enquiries are disabled", 404);
  }

  const parsed = z
    .object({
      propertyId: z.string().min(1),
      enquiryKind: z
        .enum(["basic", "inspection", "accessibility_question"])
        .optional(),
      messageBody: z.string().min(5).max(4000),
      sharedRequirementKeys: z.array(z.string()).max(20).optional(),
    })
    .safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createHomeEnquiry({
      participantId: user.id,
      actorUserId: user.id,
      propertyId: parsed.data.propertyId,
      enquiryKind: parsed.data.enquiryKind,
      messageBody: parsed.data.messageBody,
      sharedRequirementKeys: parsed.data.sharedRequirementKeys,
    });
    return jsonOk(
      {
        enquiryId: result.enquiry.id,
        conversationId: result.conversation.id,
      },
      201,
    );
  } catch (error) {
    if (error instanceof HomeEnquiriesDisabledError) {
      return jsonError("Home enquiries are disabled", 404);
    }
    if (error instanceof Error && error.message === "PROPERTY_NOT_FOUND") {
      return jsonError("Property not found", 404);
    }
    return jsonError("Unable to create enquiry", 500);
  }
}
