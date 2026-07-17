import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  applyImportJob,
  createImportJob,
  parseImportPayload,
  validateImportJob,
} from "@/lib/ndis-pricing/catalogue-import-service";
import { catalogueImportSchema } from "@/types/ndis-pricing";

export async function POST(req: Request) {
  const user = await requireApiPermission("ndis:pricing:manage");
  if (user instanceof Response) return user;

  try {
    const body = catalogueImportSchema.parse(await req.json());
    const rows = parseImportPayload(body);
    if (!rows.length) {
      return jsonError("rows or csvText required", 400);
    }

    const { job, validationErrors } = await createImportJob(
      rows,
      user.id,
      body.fileName
    );

    if (body.versionLabel || body.catalogueName) {
      // stored on client for apply step
    }

    if (validationErrors.length === 0) {
      await validateImportJob(job.id, user.id);
    }

    const action = new URL(req.url).searchParams.get("action");
    if (action === "apply" && validationErrors.length === 0) {
      const applied = await applyImportJob(job.id, user.id, {
        catalogueName: body.catalogueName,
        versionLabel: body.versionLabel,
        activate: true,
      });
      return jsonOk({ job, validationErrors, applied }, 201);
    }

    return jsonOk({ job, validationErrors }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "PRICING_IMPORT_DISABLED") {
      return jsonError("NDIS pricing import is disabled", 503);
    }
    throw e;
  }
}
