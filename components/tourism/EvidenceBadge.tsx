import { CheckCircle2, Info, ShieldAlert } from "lucide-react";

import type { AccessEvidenceStatus, LegacyEvidenceStatus } from "@/lib/tourism/types";

const copy: Record<AccessEvidenceStatus, { label: string; className: string; icon: "ok" | "info" | "alert" }> = {
  documented: {
    label: "Documented",
    className: "bg-emerald-50 text-emerald-950",
    icon: "ok",
  },
  independently_verified: {
    label: "Independently verified",
    className: "bg-emerald-50 text-emerald-950",
    icon: "ok",
  },
  requires_confirmation: {
    label: "Needs confirmation",
    className: "bg-amber-50 text-amber-950",
    icon: "info",
  },
  unknown: {
    label: "Access unknown",
    className: "bg-slate-100 text-slate-800",
    icon: "info",
  },
  conflicting: {
    label: "Conflicting sources",
    className: "bg-amber-50 text-amber-950",
    icon: "alert",
  },
};

export function EvidenceBadge({
  status,
}: {
  status: AccessEvidenceStatus | LegacyEvidenceStatus;
}) {
  const normalised: AccessEvidenceStatus =
    status === "requires-confirmation" ? "requires_confirmation" : status;
  const item = copy[normalised];
  const Icon = item.icon === "ok" ? CheckCircle2 : item.icon === "alert" ? ShieldAlert : Info;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${item.className}`}
    >
      <Icon size={13} aria-hidden />
      {item.label}
    </span>
  );
}
