import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listWorkerAffiliationsForUser } from "@/lib/workers/worker-profile-service";

export async function GET() {
  const user = await requireApiPermission("profile:read:self");
  if (user instanceof Response) return user;

  const affiliations = await listWorkerAffiliationsForUser(user.id);

  return jsonOk({
    affiliations: affiliations.map((a) => ({
      id: a.id,
      organisationId: a.organisationId,
      organisationName: a.organisation.name,
      organisationType: a.organisation.organisationType,
      displayName: a.displayName,
      affiliationStatus: a.affiliationStatus,
      active: a.active,
      affiliatedAt: a.affiliatedAt,
      providers: a.providers,
    })),
  });
}
