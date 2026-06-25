import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { interestFormSchema } from "@/lib/interest/interest-form-schema";
import { sendInterestFormEmail } from "@/lib/interest/send-interest-email";
import { isContactEmailConfigured } from "@/lib/contact/send-contact-email";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

const SUCCESS_MESSAGE =
  "Thanks — your interest was received. MapAble will respond using the email address you provided.";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = interestFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid form data";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    if (parsed.data.company) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    if (isContactEmailConfigured() || process.env.NODE_ENV !== "production") {
      await sendInterestFormEmail(parsed.data);
    } else {
      return NextResponse.json(
        {
          error:
            "Form is temporarily unavailable. Please email support@mapable.com.au.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch {
    return NextResponse.json(
      { error: "Could not send your submission. Please try again later." },
      { status: 500 },
    );
  }
}
