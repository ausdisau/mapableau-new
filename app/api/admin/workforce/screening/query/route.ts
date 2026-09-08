import { ZodError } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { runWorkerScreeningQuery } from "@/lib/workforce/screening/query-service";

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    const report = await runWorkerScreeningQuery(body);
    return Response.json({ ok: true, report });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          ok: false,
          error: "Worker screening query is incomplete or invalid.",
          issues: error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        ok: false,
        error: "Worker screening query could not be processed.",
      },
      { status: 500 },
    );
  }
}
