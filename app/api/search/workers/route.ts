import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { searchSupportWorkers } from "@/lib/matching/support-worker-matching";
import type { SupportRequest, SupportType } from "@/types/support-workers";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const serviceType = searchParams.get("serviceType");
  const now = new Date();
  const ends = new Date(now.getTime() + 2 * 60 * 60_000);

  const request: SupportRequest = {
    supportType: (serviceType as SupportType) ?? "community_access",
    startsAt: now.toISOString(),
    endsAt: ends.toISOString(),
    languages: searchParams.get("language")
      ? [searchParams.get("language")!]
      : undefined,
  };

  const result = await searchSupportWorkers(request, user.id);
  return jsonOk({
    results: result.workers.map((w) => ({
      id: w.id,
      displayName: w.displayName,
      serviceTypes: w.serviceTypes,
      serviceRegions: [],
      languages: w.languages,
      verificationStatus: w.verificationStatus,
      profileSummary: w.profileSummary,
    })),
  });
}
