import { prisma } from "@/lib/prisma";

import { ensureRegistrationControlsSeeded } from "./source-registry";

export async function listRegistrationControls() {
  await ensureRegistrationControlsSeeded();
  return prisma.registrationControl.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });
}

export async function listControlsWithComplianceMapping() {
  const controls = await listRegistrationControls();
  const codes = controls
    .map((c) => c.complianceControlCode)
    .filter((c): c is string => Boolean(c));

  const compliance =
    codes.length === 0
      ? []
      : await prisma.complianceControl.findMany({
          where: { code: { in: codes } },
        });

  const byCode = new Map(compliance.map((c) => [c.code, c]));

  return controls.map((control) => ({
    ...control,
    linkedComplianceControl: control.complianceControlCode
      ? byCode.get(control.complianceControlCode) ?? null
      : null,
  }));
}
