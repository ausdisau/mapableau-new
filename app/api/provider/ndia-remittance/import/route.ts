import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { assertOrganisationAccess } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { importNdiaRemittanceCsv } from "@/lib/ndia/remittance/remittance-service";

const schema = z.object({
  organisationId: z.string().cuid(),
  fileName: z.string().min(1).max(200),
  csvContent: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrganisationAccess(user, parsed.data.organisationId);
    const result = await importNdiaRemittanceCsv({
      organisationId: parsed.data.organisationId,
      importedById: user.id,
      fileName: parsed.data.fileName,
      csvContent: parsed.data.csvContent,
    });
    return jsonOk({ import: result }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "EMPTY_REMITTANCE_FILE") {
      return jsonError("CSV file is empty or has no data rows", 400);
    }
    throw e;
  }
}
