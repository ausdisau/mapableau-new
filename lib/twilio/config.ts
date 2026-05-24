function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export const twilioConfig = {
  accountSid: readEnv("TWILIO_ACCOUNT_SID"),
  authToken: readEnv("TWILIO_AUTH_TOKEN"),
  messagingServiceSid: readEnv("TWILIO_MESSAGING_SERVICE_SID"),
  verifyServiceSid: readEnv("TWILIO_VERIFY_SERVICE_SID"),
  webhookAuthToken:
    readEnv("TWILIO_WEBHOOK_AUTH_TOKEN") ?? readEnv("TWILIO_AUTH_TOKEN"),
  fromNumber: readEnv("TWILIO_FROM_NUMBER"),
  whatsappFrom: readEnv("TWILIO_WHATSAPP_FROM"),
};

export function isTwilioConfigured(): boolean {
  return Boolean(
    twilioConfig.accountSid &&
      twilioConfig.authToken &&
      twilioConfig.messagingServiceSid
  );
}

export function isTwilioVerifyConfigured(): boolean {
  return Boolean(
    twilioConfig.accountSid &&
      twilioConfig.authToken &&
      twilioConfig.verifyServiceSid
  );
}
