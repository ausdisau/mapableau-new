/**
 * Conformance checks for status list behaviour.
 *
 * Wave 9 keeps status lists private-only by default. This module produces
 * findings that a status list is safe to publish. If any check fails the
 * federation:conformance script must refuse to activate.
 */

import type { CredentialStatusList } from "@prisma/client";

export interface StatusListFinding {
  ok: boolean;
  code: string;
  message: string;
}

export function checkStatusList(list: CredentialStatusList): StatusListFinding[] {
  const findings: StatusListFinding[] = [];
  if (list.size < 131072) {
    findings.push({
      ok: false,
      code: "statuslist.min_size",
      message:
        "status list smaller than 131072 bits leaks per-participant correlation risk",
    });
  }
  if (!list.privateOnly && process.env.FEDERATION_STATUS_LIST_PUBLIC !== "true") {
    findings.push({
      ok: false,
      code: "statuslist.private_only_violated",
      message:
        "publicly-served status list requires FEDERATION_STATUS_LIST_PUBLIC=true and a privacy assessment",
    });
  }
  if (findings.length === 0) {
    findings.push({ ok: true, code: "statuslist.ok", message: "status list acceptable" });
  }
  return findings;
}
