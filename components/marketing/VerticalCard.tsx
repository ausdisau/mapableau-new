"use client";

import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  Award,
  Baby,
  BarChart3,
  Briefcase,
  Building2,
  Bus,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  IdCard,
  Layers,
  LayoutDashboard,
  MapPin,
  Scale,
  ShieldAlert,
  ShoppingBag,
  Star,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { MapAbleVertical, VerticalStatus } from "@/lib/mapable/verticals";
import {
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

const iconMap: Record<string, LucideIcon> = {
  Layers,
  Heart,
  Bus,
  Briefcase,
  MapPin,
  Award,
  ShoppingBag,
  Utensils,
  Baby,
  Activity,
  LayoutDashboard,
  Home,
  Building2,
  Users,
  ArrowRightLeft,
  HeartHandshake,
  GraduationCap,
  IdCard,
  ShieldAlert,
  Scale,
  BarChart3,
};

const statusLabels: Record<VerticalStatus, string> = {
  existing: "Available",
  planned: "Planned",
  proposed: "Proposed",
  pilot: "Pilot",
};

const statusBadgeClass: Record<VerticalStatus, string> = {
  existing: "border-[#00A979]/30 bg-[#00A979]/10 text-[#006B4F]",
  planned: "border-slate-300 bg-slate-100 text-slate-700",
  proposed: "border-[#005B7F]/20 bg-[#005B7F]/10 text-[#005B7F]",
  pilot: "border-[#F8C51C]/40 bg-[#F8C51C]/20 text-[#7A5E00]",
};

export type VerticalCardProps = {
  vertical: MapAbleVertical;
};

export function VerticalCard({ vertical }: VerticalCardProps) {
  const Icon = iconMap[vertical.themeIcon] ?? Star;
  const topFeatures = vertical.coreFeatures.slice(0, 3);
  const showPriority = vertical.priority <= 2 && vertical.status !== "existing";

  return (
    <article
      className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:border-[#005B7F]/20 hover:shadow-md focus-within:ring-4 focus-within:ring-[#F8C51C]/40"
      aria-labelledby={`vertical-${vertical.id}-title`}
    >
      <Card variant="outlined" className="flex h-full flex-col border-0 shadow-none">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#005B7F]/10 text-[#005B7F]"
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle
                  id={`vertical-${vertical.id}-title`}
                  className="text-lg font-black text-[#0C1833]"
                >
                  {vertical.shortName}
                </CardTitle>
                {showPriority ? (
                  <p className="mt-0.5 text-xs font-bold text-[#005B7F]">
                    <Star className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    High priority
                  </p>
                ) : null}
              </div>
            </div>
            <Badge
              variant="outline"
              className={statusBadgeClass[vertical.status]}
              aria-label={`Status: ${statusLabels[vertical.status]}`}
            >
              {statusLabels[vertical.status]}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-slate-600">{vertical.oneLine}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            For: {vertical.audience}
          </p>
        </CardHeader>

        <CardContent className="flex-1">
          <h3 className="sr-only">Top features for {vertical.shortName}</h3>
          <ul className="space-y-2" aria-label={`Key features of ${vertical.name}`}>
            {topFeatures.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-slate-700">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#005B7F]"
                  aria-hidden="true"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="mt-auto pt-4">
          <Link
            href={vertical.href}
            className={`${mapablePublicPrimaryButtonClass} w-full`}
            aria-label={`${vertical.primaryCta.label} — ${vertical.name}`}
          >
            {vertical.primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardFooter>
      </Card>
    </article>
  );
}

export { statusLabels, statusBadgeClass };
