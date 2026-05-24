import { z } from "zod";

export const createReferralSchema = z.object({
  participantId: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  providerId: z.string().optional(),
  organisationId: z.string().optional(),
});

export const updateReferralSchema = z.object({
  status: z.enum([
    "approved",
    "declined",
    "sent_to_provider",
    "converted_to_booking",
    "closed",
  ]),
  bookingId: z.string().optional(),
  notes: z.string().optional(),
});

export const createNoteSchema = z.object({
  participantId: z.string().min(1),
  content: z.string().min(1, "Note content is required"),
  relationshipId: z.string().optional(),
});

export const planReviewReminderSchema = z.object({
  participantId: z.string().min(1),
  reviewDate: z.string().datetime(),
  title: z.string().min(1),
  notes: z.string().optional(),
});
