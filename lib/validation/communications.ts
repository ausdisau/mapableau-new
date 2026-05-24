import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

export function normalizePhoneE164(phone: string): string | null {
  const parsed = parsePhoneNumberFromString(phone, "AU");
  if (!parsed?.isValid()) {
    const intl = parsePhoneNumberFromString(phone);
    if (!intl?.isValid()) return null;
    return intl.format("E.164");
  }
  return parsed.format("E.164");
}

export const phoneStartSchema = z.object({
  phone: z.string().min(8).max(20),
  channel: z.enum(["sms", "call"]).optional(),
});

export const phoneCheckSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().min(4).max(10),
});

export const communicationPreferenceUpdateSchema = z.object({
  preferences: z.array(
    z.object({
      channel: z.enum(["sms", "voice", "whatsapp", "email", "in_app"]),
      notificationType: z.string().default("all"),
      enabled: z.boolean(),
      consentStatus: z
        .enum(["opted_in", "opted_out", "pending", "revoked"])
        .optional(),
      quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      accessibleCommunicationMode: z.string().max(64).nullable().optional(),
      timezone: z.string().max(64).optional(),
    })
  ),
  phone: z.string().optional(),
});
