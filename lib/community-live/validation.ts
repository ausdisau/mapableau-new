import { z } from "zod";

const shortText = (n: number) => z.string().trim().min(2).max(n);
const longText = (n: number) => z.string().trim().min(12).max(n);

export const createChallengeSchema = z.object({
  title: shortText(160),
  template: z.enum(["street", "journey", "venue", "crossing", "sensory", "temporary"]),
  boundary: shortText(200),
  instruction: longText(1200),
}).strict();

export const createFindingSchema = z.object({
  challengeId: z.string().min(1).max(80),
  title: shortText(160),
  feature: shortText(100),
  finding: longText(2000),
  method: z.enum(["direct observation", "measurement", "community report", "operator report", "document review"]),
  observedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consentScope: z.enum(["private", "review", "public"]),
  consentAcknowledged: z.literal(true),
}).strict().refine((value) => {
  const d = new Date(value.observedAt + "T00:00:00.000Z");
  return !Number.isNaN(d.getTime()) &&
    d.toISOString().startsWith(value.observedAt) &&
    d.getTime() <= Date.now() + 24 * 60 * 60 * 1000;
}, { message: "Observation date is invalid or in the future", path: ["observedAt"] });

export const moderateFindingSchema = z.object({
  id: z.string().min(1).max(80),
  decision: z.enum(["approved", "rejected", "needs_info"]),
  note: z.string().trim().max(400).default(""),
}).strict();

export async function parseCommunityJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("CONTENT_TYPE");
  }
  const text = await request.text();
  if (text.length > 12000) throw new Error("BODY_TOO_LARGE");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }
}
