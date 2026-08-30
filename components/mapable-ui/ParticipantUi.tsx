import Link from "next/link";
import type { ReactNode } from "react";

export type ParticipantTone =
  | "neutral"
  | "access"
  | "care"
  | "travel"
  | "jobs"
  | "support";

type ToneStyle = {
  marker: string;
  label: string;
  status: string;
  panel: string;
  solidAction: string;
  outlineAction: string;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40";

const toneStyles: Record<ParticipantTone, ToneStyle> = {
  neutral: {
    marker: "bg-slate-100 text-[#0C1833]",
    label: "text-[#005B7F]",
    status: "border-slate-300 bg-slate-50 text-[#0C1833]",
    panel: "border-slate-200 bg-white",
    solidAction: "bg-[#005B7F] text-white hover:bg-[#004766]",
    outlineAction:
      "border-slate-300 bg-white text-[#005B7F] hover:bg-slate-50",
  },
  access: {
    marker: "bg-cyan-50 text-[#005B7F]",
    label: "text-[#005B7F]",
    status: "border-cyan-200 bg-cyan-50 text-[#005B7F]",
    panel: "border-cyan-100 bg-white",
    solidAction: "bg-[#005B7F] text-white hover:bg-[#004766]",
    outlineAction:
      "border-cyan-300 bg-white text-[#005B7F] hover:bg-cyan-50",
  },
  care: {
    marker: "bg-purple-50 text-purple-700",
    label: "text-purple-700",
    status: "border-purple-200 bg-purple-50 text-purple-800",
    panel: "border-purple-100 bg-white",
    solidAction: "bg-purple-700 text-white hover:bg-purple-800",
    outlineAction:
      "border-purple-300 bg-white text-purple-800 hover:bg-purple-50",
  },
  travel: {
    marker: "bg-blue-50 text-blue-700",
    label: "text-blue-700",
    status: "border-blue-200 bg-blue-50 text-blue-800",
    panel: "border-blue-100 bg-white",
    solidAction: "bg-blue-700 text-white hover:bg-blue-800",
    outlineAction:
      "border-blue-300 bg-white text-blue-800 hover:bg-blue-50",
  },
  jobs: {
    marker: "bg-orange-50 text-orange-700",
    label: "text-orange-700",
    status: "border-orange-200 bg-orange-50 text-orange-800",
    panel: "border-orange-100 bg-white",
    solidAction: "bg-orange-600 text-white hover:bg-orange-700",
    outlineAction:
      "border-orange-300 bg-white text-orange-800 hover:bg-orange-50",
  },
  support: {
    marker: "bg-purple-100 text-purple-800",
    label: "text-purple-800",
    status: "border-purple-300 bg-purple-100 text-purple-900",
    panel: "border-purple-200 bg-purple-50",
    solidAction: "bg-purple-800 text-white hover:bg-purple-900",
    outlineAction:
      "border-purple-400 bg-white text-purple-800 hover:bg-purple-100",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const participantUiContract = {
  minTargetCssPx: 48,
  primaryNavy: "#0C1833",
  primaryTeal: "#005B7F",
  focusGold: "#F8C51C",
  cardRadiusRem: 1.5,
} as const;

export function ParticipantPanel({
  children,
  className,
  labelledBy,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  tone?: ParticipantTone;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cx(
        "rounded-[1.5rem] border p-5 shadow-sm sm:p-6",
        toneStyles[tone].panel,
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ParticipantMarker({
  label,
  tone,
}: {
  label: string;
  tone: ParticipantTone;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black",
        toneStyles[tone].marker,
      )}
    >
      {label}
    </span>
  );
}

export function ParticipantStatus({
  label,
  tone,
}: {
  label: string;
  tone: ParticipantTone;
}) {
  return (
    <span
      aria-label={`Status: ${label}`}
      className={cx(
        "w-fit rounded-full border px-3 py-2 text-xs font-black capitalize",
        toneStyles[tone].status,
      )}
    >
      {label}
    </span>
  );
}

export function ParticipantActionLink({
  href,
  children,
  className,
  fullWidth = false,
  tone = "neutral",
  variant = "outline",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  tone?: ParticipantTone;
  variant?: "solid" | "outline";
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-sm font-black transition-colors",
        focusRing,
        fullWidth && "w-full",
        variant === "solid"
          ? cx("border-transparent", toneStyles[tone].solidAction)
          : toneStyles[tone].outlineAction,
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function ParticipantServiceShortcut({
  href,
  label,
  description,
  marker,
  tone,
}: {
  href: string;
  label: string;
  description: string;
  marker: string;
  tone: ParticipantTone;
}) {
  return (
    <div className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <ParticipantMarker label={marker} tone={tone} />
        <h3 className="text-lg font-bold text-[#0C1833]">{label}</h3>
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">
        {description}
      </p>
      <ParticipantActionLink
        href={href}
        tone={tone}
        variant="solid"
        className="mt-5 justify-between"
      >
        <span>View {label.toLowerCase()}</span>
        <span aria-hidden="true">→</span>
      </ParticipantActionLink>
    </div>
  );
}

export function ParticipantEyebrow({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: ParticipantTone;
}) {
  return (
    <p
      className={cx(
        "text-xs font-black uppercase tracking-[0.12em]",
        toneStyles[tone].label,
      )}
    >
      {children}
    </p>
  );
}
