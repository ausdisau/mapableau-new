import { NextResponse } from "next/server";
import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  isContactEmailConfigured,
  sendContactFormEmail,
} from "@/lib/contact/send-contact-email";
import { getSuburbGuideByStateSlug } from "@/lib/resources/suburb-access-guides-data";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

const SUCCESS_MESSAGE =
  "Thanks — your suburb guide update was received. MapAble will review it using the email address you provided.";

const reportUpdateSchema = z.object({
  state: z.string().trim().min(2).max(8),
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  updateType: z.enum([
    "toilet",
    "transport",
    "parking",
    "quiet-space",
    "hazard",
    "other",
  ]),
  details: z
    .string()
    .trim()
    .min(20, "Please add a few more details (at least 20 characters)")
    .max(5000),
  company: z.string().max(0).optional(),
});

/**
 * Public JSON POST for suburb Access Guide update reports.
 * Routes through the existing contact email path (no Prisma suburb table yet).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return NextResponse.json(
      { error: "Too many messages sent. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = reportUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid form data";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    if (parsed.data.company) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    const guide = getSuburbGuideByStateSlug(
      parsed.data.state.toLowerCase(),
      parsed.data.slug,
    );
    if (!guide) {
      return NextResponse.json(
        { error: "That suburb guide could not be found." },
        { status: 404 },
      );
    }

    const message = [
      `Suburb Access Guide update report`,
      `Guide: ${guide.name} (${guide.state})`,
      `SAL: ${guide.salCode}`,
      `Path: ${guide.href}`,
      `Update type: ${parsed.data.updateType}`,
      "",
      parsed.data.details,
    ].join("\n");

    if (isContactEmailConfigured() || process.env.NODE_ENV !== "production") {
      await sendContactFormEmail({
        name: parsed.data.name,
        email: parsed.data.email,
        topic: "accessibility",
        message,
      });
    } else {
      console.error(
        "[suburb-guide-report] SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not configured",
      );
      return NextResponse.json(
        {
          error:
            "Update form is temporarily unavailable. Please email support@mapable.com.au.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[suburb-guide-report] submission failed", error);
    return NextResponse.json(
      { error: "Could not send your update. Please try again later." },
      { status: 500 },
    );
  }
}
