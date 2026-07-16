import { withContinuityHandler } from "@/lib/continuity-os/api";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { canViewOrganisationContinuity } from "@/lib/continuity-os/permissions";
import { listPlaybooks } from "@/lib/continuity-os/recovery/playbooks";
import { getContinuityOsFlags } from "@/lib/continuity-os/feature-flags";

export const GET = withContinuityHandler(async (user) => {
  if (!canViewOrganisationContinuity(user)) {
    throw new ContinuityOsError(
      "FORBIDDEN",
      "Organisation continuity metrics only — not unrestricted participant life-event access.",
      403
    );
  }

  return Response.json({
    mode: getContinuityOsFlags().mode,
    playbooks: listPlaybooks().map((p) => ({
      code: p.code,
      version: p.version,
      title: p.title,
      highRisk: p.highRisk,
    })),
    note: "Administrators do not receive unrestricted routine access to participant life-event or recovery content.",
  });
});
