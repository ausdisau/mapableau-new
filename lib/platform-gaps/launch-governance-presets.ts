import { upsertPlatformGapOverride } from "@/lib/platform-gaps/platform-gap-service";
import type { PlatformGapResolutionStatus } from "@/lib/platform-gaps/types";

/** Non-blocking gaps accepted for v1 public launch (Track E5 / F). */
export const LAUNCH_DEFERRAL_GAP_PRESETS: {
  code: string;
  status: PlatformGapResolutionStatus;
  notes: string;
}[] = [
  {
    code: "bp.satellite_apps",
    status: "accepted_risk",
    notes: "Roadmap ecosystem apps; out of v1 public launch scope.",
  },
  {
    code: "transport.no_live_gps",
    status: "accepted_risk",
    notes: "Live GPS deferred to post-launch transport phase.",
  },
  {
    code: "jobs.not_full_ats",
    status: "accepted_risk",
    notes: "Jobs foundation only for v1; full ATS not required for launch gate.",
  },
  {
    code: "core.ui_phase4_polish",
    status: "accepted_risk",
    notes: "Optional core hub polish; not launch-blocking.",
  },
  {
    code: "integ.stub_engines",
    status: "accepted_risk",
    notes: "OSS stub pack by design until adapters ship; do not enable in prod marketing.",
  },
];

export async function applyLaunchGovernanceDeferrals(actorUserId: string) {
  const results = [];
  for (const preset of LAUNCH_DEFERRAL_GAP_PRESETS) {
    const row = await upsertPlatformGapOverride({
      code: preset.code,
      status: preset.status,
      notes: preset.notes,
      actorUserId,
    });
    results.push(row);
  }
  return results;
}
