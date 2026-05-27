import { runReport } from "@/lib/reports/report-runner-service";

export async function generateBoardReport(createdById: string, reportPeriod: string) {
  const result = await runReport({
    reportKey: "board_pack",
    actorUserId: createdById,
    actorRole: "mapable_admin",
    parameters: { reportPeriod },
  });

  if ("disabled" in result && result.disabled) {
    return { disabled: true as const };
  }

  return result.snapshot;
}
