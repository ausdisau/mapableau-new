import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { draftGovernmentReportPack } from "@/lib/government-reporting/report-pack-service";
import { captureNationalInsightSnapshot } from "@/lib/national-insights/insights-service";
import { generateOpenDataExport } from "@/lib/open-data/open-data-service";
import { recordUsageEvent } from "@/lib/usage/usage-ledger";
import { prisma } from "@/lib/prisma";

export type LicensedPackType =
  | "national_insights_brief"
  | "regional_open_data"
  | "government_report"
  | "provider_benchmark";

export async function organisationHasLicensedPack(
  organisationId: string,
  packType: LicensedPackType
) {
  const account = await prisma.partnerBillingAccount.findUnique({
    where: { organisationId },
  });
  if (!account) return false;
  return account.licensedPackTypes.includes(packType);
}

export async function generateLicensedPack(params: {
  organisationId: string;
  packType: LicensedPackType;
  actorUserId: string;
  periodLabel?: string;
}) {
  const entitled = await organisationHasLicensedPack(
    params.organisationId,
    params.packType
  );
  if (!entitled) {
    return {
      ok: false as const,
      error: "Organisation is not licensed for this pack. Contact MapAble sales.",
    };
  }

  let payload: Record<string, unknown>;
  switch (params.packType) {
    case "national_insights_brief": {
      const snapshot = await captureNationalInsightSnapshot(
        params.periodLabel ?? `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
      );
      payload = { type: params.packType, snapshot };
      break;
    }
    case "regional_open_data": {
      const exportResult = await generateOpenDataExport(
        "accessible-places",
        params.actorUserId
      );
      payload = { type: params.packType, export: exportResult };
      break;
    }
    case "government_report": {
      const pack = await draftGovernmentReportPack({
        packType: "sla_outcomes",
        title: `Government report pack — ${params.periodLabel ?? "pilot"}`,
        createdById: params.actorUserId,
      });
      payload = { type: params.packType, pack };
      break;
    }
    case "provider_benchmark":
      payload = {
        type: params.packType,
        status: "pilot_placeholder",
        message: "Provider benchmark pack requires PROVIDER_BENCHMARKING_V2_ENABLED.",
      };
      break;
    default: {
      const _exhaustive: never = params.packType;
      return { ok: false as const, error: `Unknown pack type: ${_exhaustive}` };
    }
  }

  await recordUsageEvent({
    category: "licensed_pack",
    eventType: `licensed_pack.${params.packType}`,
    userId: params.actorUserId,
    organisationId: params.organisationId,
    metadata: { periodLabel: params.periodLabel },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "licensed_pack.generated",
    entityType: "Organisation",
    entityId: params.organisationId,
    metadata: { packType: params.packType },
  });

  return {
    ok: true as const,
    packType: params.packType,
    downloadReady: true,
    payload,
    disclaimer:
      "Licensed aggregate data only. Small-cell suppression applied. Not for re-identification.",
  };
}

export async function grantLicensedPackTypes(
  organisationId: string,
  packTypes: LicensedPackType[]
) {
  const account = await prisma.partnerBillingAccount.upsert({
    where: { organisationId },
    create: {
      organisationId,
      licensedPackTypes: packTypes,
      planCode: "data_licensing",
    },
    update: {
      licensedPackTypes: packTypes,
    },
  });
  return account;
}
