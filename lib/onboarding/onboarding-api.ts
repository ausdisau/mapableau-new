import { NextResponse } from "next/server";
import type { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { OnboardingApiResponse } from "@/types/registration";

export async function requireOnboardingUser(): Promise<
  { ok: true; user: CurrentUser } | { ok: false; response: Response }
> {
  const user = await requireApiSession();
  if (user instanceof Response) {
    return { ok: false, response: user };
  }
  return { ok: true, user };
}

export function zodToApiErrors(
  error: z.ZodError
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "_form",
    message: issue.message,
  }));
}

export function apiJson(
  body: OnboardingApiResponse,
  status = body.success ? 200 : 400
) {
  return NextResponse.json(body, { status });
}

export async function parseJsonBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse }
> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      ok: false,
      response: apiJson({
        success: false,
        errors: [{ field: "_form", message: "Invalid request body" }],
      }),
    };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiJson({
        success: false,
        errors: zodToApiErrors(parsed.error),
      }),
    };
  }
  return { ok: true, data: parsed.data };
}

export function requestMeta(req: Request) {
  return {
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };
}
