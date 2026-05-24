import { validateRequest } from "twilio";

import { twilioConfig } from "@/lib/twilio/config";

export function validateTwilioWebhookSignature(params: {
  signature: string | null;
  url: string;
  body: Record<string, string>;
}): boolean {
  const token = twilioConfig.webhookAuthToken;
  if (!token || !params.signature) {
    return false;
  }

  return validateRequest(token, params.signature, params.url, params.body);
}

export function formDataToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  formData.forEach((value, key) => {
    record[key] = String(value);
  });
  return record;
}
