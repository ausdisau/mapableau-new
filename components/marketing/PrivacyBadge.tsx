import { Lock, Shield, Eye, FileText, BarChart2 } from "lucide-react";

export type PrivacyBadgeVariant =
  | "consent-controlled"
  | "role-based"
  | "private-by-default"
  | "audit-logged"
  | "aggregated-only";

const badgeConfig: Record<
  PrivacyBadgeVariant,
  { label: string; icon: typeof Lock; description: string }
> = {
  "consent-controlled": {
    label: "Consent controlled",
    icon: Shield,
    description: "You choose what to share and with whom.",
  },
  "role-based": {
    label: "Role based",
    icon: Lock,
    description: "Access depends on your role and permissions.",
  },
  "private-by-default": {
    label: "Private by default",
    icon: Eye,
    description: "Sensitive information stays private until you share it.",
  },
  "audit-logged": {
    label: "Audit logged",
    icon: FileText,
    description: "Sharing and access events are recorded.",
  },
  "aggregated-only": {
    label: "Aggregated only",
    icon: BarChart2,
    description: "Reports use anonymised, grouped data only.",
  },
};

export type PrivacyBadgeProps = {
  variant: PrivacyBadgeVariant;
};

export function PrivacyBadge({ variant }: PrivacyBadgeProps) {
  const config = badgeConfig[variant];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-[#005B7F]/20 bg-[#005B7F]/5 px-3 py-1.5 text-xs font-bold text-[#005B7F]"
      title={config.description}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export function PrivacyBadgeRow({ variants }: { variants: PrivacyBadgeVariant[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Privacy features">
      {variants.map((variant) => (
        <span key={variant} role="listitem">
          <PrivacyBadge variant={variant} />
        </span>
      ))}
    </div>
  );
}
