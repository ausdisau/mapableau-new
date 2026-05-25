import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  listRecoveryCases,
  openRecoveryCase,
} from "@/lib/service-recovery/recovery-case-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const participantId = isAdminRole(user.primaryRole)
    ? searchParams.get("participantId") ?? undefined
    : user.id;

  try {
    const cases = await listRecoveryCases({
      participantId,
      organisationId: searchParams.get("organisationId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return jsonOk({ cases });
  } catch (e) {
    if (e instanceof Error && e.message === "MODULE_DISABLED") {
      return jsonError("Service recovery is not available", 503);
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  try {
    const caseRecord = await openRecoveryCase({
      participantId: body.participantId ?? user.id,
      trigger: body.trigger,
      summary: body.summary,
      bookingId: body.bookingId,
      organisationId: body.organisationId,
      createdById: user.id,
    });
    return jsonOk({ case: caseRecord }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "MODULE_DISABLED") {
      return jsonError("Service recovery is not available", 503);
    }
    throw e;
  }
}
