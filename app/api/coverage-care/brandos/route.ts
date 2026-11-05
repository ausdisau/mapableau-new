import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import {
  createBrandContent,
  listBrandContent,
} from "@/lib/coverage-care/brandos-service";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";
import { COVERAGE_CARE_CONTENT_KINDS } from "@/lib/coverage-care/types";

const createSchema = z.object({
  kind: z.enum(COVERAGE_CARE_CONTENT_KINDS),
  title: z.string().min(1),
  body: z.string().min(1),
});

export async function GET() {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  try {
    return jsonOk({ items: listBrandContent() });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}

export async function POST(request: Request) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  try {
    const body = createSchema.parse(await request.json());
    const item = createBrandContent({
      actor,
      actorTenantId: resolveActorTenantId(
        request.headers.get("x-mapable-tenant-id"),
      ),
      kind: body.kind,
      title: body.title,
      body: body.body,
    });
    return jsonOk({ item }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return mapCoverageCareError(error);
  }
}
