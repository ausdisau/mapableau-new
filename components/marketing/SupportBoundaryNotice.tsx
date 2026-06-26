import { AlertTriangle, Info, Scale, Stethoscope, Shield } from "lucide-react";
import type { ReactNode } from "react";

export type BoundaryVariant =
  | "informational"
  | "ndis"
  | "emergency"
  | "legal"
  | "clinical"
  | "safeguarding";

const variantCopy: Record<BoundaryVariant, { title: string; body: string }> = {
  informational: {
    title: "Information only",
    body: "This page provides general information and coordination support. It does not replace professional advice or official decisions.",
  },
  ndis: {
    title: "NDIS information",
    body: "This page provides general information and coordination support. It does not decide NDIS eligibility, funding, or reasonable and necessary outcomes.",
  },
  emergency: {
    title: "Not an emergency service",
    body: "MapAble is not an emergency service. If someone is in immediate danger, call 000.",
  },
  legal: {
    title: "Not legal advice",
    body: "This is not legal advice. For legal advice, contact a qualified legal service or advocate.",
  },
  clinical: {
    title: "Not clinical advice",
    body: "This is not medical or clinical advice. Speak with a qualified health professional for clinical decisions.",
  },
  safeguarding: {
    title: "Safeguarding",
    body: "If you are worried about violence, abuse, neglect, exploitation, or sexual misconduct, seek urgent help from emergency services or the appropriate safeguarding body.",
  },
};

const variantIcon: Record<BoundaryVariant, typeof Info> = {
  informational: Info,
  emergency: AlertTriangle,
  ndis: Info,
  legal: Scale,
  clinical: Stethoscope,
  safeguarding: Shield,
};

const variantStyles: Record<BoundaryVariant, string> = {
  informational: "border-slate-200 bg-slate-50",
  ndis: "border-[#005B7F]/15 bg-[#F6FBFC]",
  emergency: "border-amber-300 bg-amber-50",
  legal: "border-slate-200 bg-slate-50",
  clinical: "border-slate-200 bg-slate-50",
  safeguarding: "border-amber-200 bg-amber-50/80",
};

export type SupportBoundaryNoticeProps = {
  variant: BoundaryVariant;
  children?: ReactNode;
};

export function SupportBoundaryNotice({ variant, children }: SupportBoundaryNoticeProps) {
  const copy = variantCopy[variant];
  const Icon = variantIcon[variant];
  const isEmergency = variant === "emergency" || variant === "safeguarding";

  return (
    <aside
      role={isEmergency ? "alert" : "note"}
      className={`rounded-[1.25rem] border p-5 sm:p-6 ${variantStyles[variant]}`}
      aria-labelledby={`boundary-${variant}-title`}
    >
      <div className="flex gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${isEmergency ? "text-amber-700" : "text-[#005B7F]"}`}
          aria-hidden="true"
        />
        <div>
          <h2
            id={`boundary-${variant}-title`}
            className="text-base font-black text-[#0C1833]"
          >
            {copy.title}
          </h2>
          <p className="mt-1 text-sm leading-7 text-slate-700">{copy.body}</p>
          {children ? <div className="mt-3 text-sm text-slate-700">{children}</div> : null}
        </div>
      </div>
    </aside>
  );
}
