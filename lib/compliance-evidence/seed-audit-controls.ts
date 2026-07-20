import type { SecurityFrameworkType } from "@prisma/client";

import {
  ALL_AUDIT_CONTROLS,
  IRAP_ISM_CONTROLS,
  SOC2_CONTROLS,
} from "@/lib/compliance-evidence/audit-control-catalog";
import { prisma } from "@/lib/prisma";

const FRAMEWORKS: {
  type: SecurityFrameworkType;
  name: string;
}[] = [
  { type: "soc2", name: "SOC 2 Type II readiness" },
  { type: "internal", name: "IRAP / ISM readiness" },
  { type: "privacy_act", name: "Privacy Act / APP readiness" },
  { type: "ndis_quality_safeguards", name: "NDIS Quality & Safeguards readiness" },
];

export async function seedAuditControlCatalog() {
  const frameworkByTrack = new Map<string, string>();

  for (const fw of FRAMEWORKS) {
    const existing = await prisma.securityFramework.findFirst({
      where: { type: fw.type, name: fw.name },
    });
    const record =
      existing ??
      (await prisma.securityFramework.create({
        data: { type: fw.type, name: fw.name, active: true },
      }));
    if (fw.type === "soc2") frameworkByTrack.set("soc2", record.id);
    if (fw.type === "internal") frameworkByTrack.set("irap", record.id);
  }

  const soc2FrameworkId = frameworkByTrack.get("soc2");
  const irapFrameworkId = frameworkByTrack.get("irap");
  if (!soc2FrameworkId || !irapFrameworkId) {
    throw new Error("Failed to seed audit frameworks");
  }

  let created = 0;
  let updated = 0;

  for (const control of SOC2_CONTROLS) {
    const result = await upsertSecurityControl(soc2FrameworkId, control);
    if (result === "created") created++;
    else updated++;
  }

  for (const control of IRAP_ISM_CONTROLS) {
    const result = await upsertSecurityControl(irapFrameworkId, control);
    if (result === "created") created++;
    else updated++;
  }

  for (const control of ALL_AUDIT_CONTROLS) {
    await prisma.complianceControl.upsert({
      where: { code: control.code },
      create: {
        code: control.code,
        title: control.title,
        module: control.track === "soc2" ? "soc2" : "irap",
        status: mapComplianceStatus(control.status),
        description: [
          control.criterion,
          control.testProcedure,
          control.gaps.length ? `Gaps: ${control.gaps.join("; ")}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      },
      update: {
        title: control.title,
        status: mapComplianceStatus(control.status),
        description: [
          control.criterion,
          control.testProcedure,
          control.gaps.length ? `Gaps: ${control.gaps.join("; ")}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });
  }

  return { created, updated, total: ALL_AUDIT_CONTROLS.length };
}

async function upsertSecurityControl(
  frameworkId: string,
  control: (typeof ALL_AUDIT_CONTROLS)[number]
): Promise<"created" | "updated"> {
  const existing = await prisma.securityControl.findFirst({
    where: { frameworkId, code: control.code },
  });

  const notes = [
    `Owner: ${control.owner}`,
    `Frequency: ${control.testFrequency}`,
    control.crosswalk ? `Crosswalk: ${control.crosswalk}` : "",
    control.remediationPhase ? `Remediation: ${control.remediationPhase}` : "",
    `Evidence: ${control.evidencePaths.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" | ");

  if (existing) {
    await prisma.securityControl.update({
      where: { id: existing.id },
      data: { title: control.title, status: control.status },
    });
    const priorEvidence = await prisma.securityEvidence.findFirst({
      where: { controlId: existing.id },
    });
    if (!priorEvidence) {
      await prisma.securityEvidence.create({
        data: { controlId: existing.id, notes },
      });
    }
    return "updated";
  }

  const row = await prisma.securityControl.create({
    data: {
      frameworkId,
      code: control.code,
      title: control.title,
      status: control.status,
    },
  });
  await prisma.securityEvidence.create({
    data: { controlId: row.id, notes },
  });
  return "created";
}

function mapComplianceStatus(
  status: (typeof ALL_AUDIT_CONTROLS)[number]["status"]
) {
  switch (status) {
    case "implemented":
    case "tested":
      return "implemented" as const;
    case "needs_review":
      return "needs_review" as const;
    case "gap_open":
      return "not_started" as const;
    default:
      return "not_started" as const;
  }
}
