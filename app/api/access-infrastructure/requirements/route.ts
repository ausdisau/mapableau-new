import type { NextRequest } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ACCESS_DOMAINS, accessInfrastructureFlags } from "@/lib/access/infrastructure";
import {
  addRequirement,
  deleteRequirement,
  updateRequirement,
} from "@/lib/access/infrastructure/passport-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!accessInfrastructureFlags.enabled || !accessInfrastructureFlags.passport) {
    return jsonError("Access Passport is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body?.ontologyConceptId || !body?.domain || !body?.attribute || !body?.criticality) {
    return jsonError("Missing required requirement fields", 400);
  }
  if (!ACCESS_DOMAINS.includes(body.domain)) {
    return jsonError("Invalid access domain", 400);
  }

  const requirement = await addRequirement(user.id, {
    ontologyConceptId: body.ontologyConceptId,
    domain: body.domain,
    attribute: body.attribute,
    comparator: body.comparator,
    value: body.value,
    unit: body.unit,
    criticality: body.criticality,
    contextScope: body.contextScope,
    timing: body.timing,
    assistance: body.assistance,
    disclosureScopes: body.disclosureScopes,
    userConfirmed: body.userConfirmed ?? true,
    notes: body.notes,
  });

  return jsonOk({ requirement, productionClaim: "none" });
}

export async function PATCH(req: NextRequest) {
  if (!accessInfrastructureFlags.enabled || !accessInfrastructureFlags.passport) {
    return jsonError("Access Passport is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body?.id) return jsonError("Requirement id required", 400);

  const requirement = await updateRequirement(user.id, body.id, body);
  if (!requirement) return jsonError("Requirement not found", 404);
  return jsonOk({ requirement, productionClaim: "none" });
}

export async function DELETE(req: NextRequest) {
  if (!accessInfrastructureFlags.enabled || !accessInfrastructureFlags.passport) {
    return jsonError("Access Passport is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Requirement id required", 400);

  const ok = await deleteRequirement(user.id, id);
  if (!ok) return jsonError("Requirement not found", 404);
  return jsonOk({ deleted: true, productionClaim: "none" });
}
