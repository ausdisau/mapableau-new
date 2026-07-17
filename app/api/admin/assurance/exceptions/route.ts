import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  approveException,
  createException,
  listExceptions,
} from "@/lib/assurance/exceptions/exception-service";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  controlId: z.string().min(1),
  title: z.string().min(1),
  rationale: z.string().min(1),
  organisationId: z.string().optional(),
  compensatingControls: z.string().optional(),
});

const patchSchema = z.object({
  exceptionId: z.string().min(1),
  action: z.literal("approve"),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const controlId = url.searchParams.get("controlId") ?? undefined;
  const organisationId = url.searchParams.get("organisationId") ?? undefined;
  const exceptions = await listExceptions({ controlId, organisationId });
  return jsonOk({ exceptions });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("assurance:exceptions:manage");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const exception = await createException({
    ...parsed.data,
    createdById: user.id,
  });
  return jsonOk({ exception });
}

export async function PATCH(req: Request) {
  const user = await requireApiPermission("assurance:exceptions:manage");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const exception = await approveException({
    exceptionId: parsed.data.exceptionId,
    approvedById: user.id,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });
  return jsonOk({ exception, note: "Empty or expired exceptions never support approval." });
}
