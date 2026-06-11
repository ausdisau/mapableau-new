import { buildAiMeta } from "@/lib/coordinate/ai/escalation";

export function draftCommunication(params: {
  participantName: string;
  topic: string;
  channel: "email" | "sms" | "in_app";
}): {
  subject?: string;
  body: string;
  plainLanguageBody: string;
  meta: ReturnType<typeof buildAiMeta>;
} {
  const subject = `Checking in about ${params.topic}`;
  const body = `Hi ${params.participantName},\n\nI prepared a message about ${params.topic}. Please review this draft in MapAble Coordinate before anything is sent.\n\nThis is a draft only — nothing has been sent automatically.\n\nKind regards`;
  const plainLanguageBody = `Hi ${params.participantName} — I wrote a draft message about ${params.topic}. You need to approve it before it can be sent. Nothing goes out automatically.`;

  const smsBody =
    params.channel === "sms"
      ? `${params.participantName}, draft ready about ${params.topic}. Approve in MapAble Coordinate before send.`
      : body;

  return {
    subject: params.channel === "email" ? subject : undefined,
    body: params.channel === "sms" ? smsBody : body,
    plainLanguageBody,
    meta: buildAiMeta({
      confidence: 0.68,
      reason: "Template draft with mandatory approval disclaimer.",
    }),
  };
}
