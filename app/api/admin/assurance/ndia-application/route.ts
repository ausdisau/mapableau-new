import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listNdiaDigitalPartnershipApplications,
  upsertNdiaDigitalPartnershipApplication,
} from "@/lib/assurance/ndia-application/digital-partnership-service";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  organisationId: z.string().min(1),
  status: z
    .enum([
      "not_started",
      "draft",
      "internal_ready",
      "awaiting_external_pack",
      "submitted",
      "in_assessment",
      "approved",
      "rejected",
      "suspended",
      "withdrawn",
    ])
    .optional(),
  technicalPackReference: z.string().optional(),
  myIdConfigured: z.boolean().optional(),
  ramConfigured: z.boolean().optional(),
  credentialsPresent: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId") ?? undefined;
  const applications = await listNdiaDigitalPartnershipApplications(organisationId);
  return jsonOk({
    applications,
    disclaimer: "No myID/RAM credentials are stored or returned by this API.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("assurance:ndia-application:manage");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const application = await upsertNdiaDigitalPartnershipApplication({
    ...parsed.data,
    ownerUserId: user.id,
  });
  return jsonOk({ application });
}
