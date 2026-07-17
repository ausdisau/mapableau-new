import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { listControls, updateControlStatus } from "@/lib/assurance/controls/control-service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  controlId: z.string().min(1),
  assuranceStatus: z.enum([
    "not_started",
    "designed",
    "implemented",
    "operating",
    "ineffective",
    "not_applicable",
    "exception_granted",
  ]),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const frameworkId = url.searchParams.get("frameworkId") ?? undefined;
  const controls = await listControls({ frameworkId });
  return jsonOk({ controls });
}

export async function PATCH(req: Request) {
  const user = await requireApiPermission("assurance:manage");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const control = await updateControlStatus({
    controlId: parsed.data.controlId,
    assuranceStatus: parsed.data.assuranceStatus,
    assessedById: user.id,
  });
  return jsonOk({ control });
}
