import {
  KeyRound,
  Layers3,
  LineChart,
  Link2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Status cards are not usage metrics. Replace them with scoped server-side
 * data only after partner identity, consent and audit have been reviewed.
 */
const KPI_CARDS = [
  {
    title: "API Requests (This Month)",
    value: "Not reported",
    hint: "No verified request totals connected",
    icon: LineChart,
  },
  {
    title: "Active Embed Widgets",
    value: "Not reported",
    hint: "No authorised widget usage data connected",
    icon: Layers3,
  },
  {
    title: "Accessibility Reports Generated",
    value: "Not available",
    hint: "No verified reports connected",
    icon: Sparkles,
  },
  {
    title: "Referral Credits Earned",
    value: "Not available",
    hint: "No approved referral-credit ledger connected",
    icon: Link2,
  },
] as const;

const QUICK_ACTIONS = [
  {
    href: "/partner/developer",
    label: "Explore API integrations",
    description: "Review available developer tools and permissions",
    icon: KeyRound,
  },
  {
    href: "/partner/analytics",
    label: "View reporting status",
    description: "See which accessibility reports are currently available",
    icon: LineChart,
  },
  {
    href: "/partner/referrals",
    label: "View referral status",
    description: "Review whether referral links are enabled for your account",
    icon: Link2,
  },
] as const;

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-bold">Dashboard</h2>
        <p className="max-w-2xl text-muted-foreground">
          An overview of partner integration and reporting options. Verified account-level
          statistics and referral credits are not connected to this dashboard.
        </p>
      </header>

      <section aria-labelledby="partner-kpis-heading">
        <h3 id="partner-kpis-heading" className="sr-only">
          Current data availability
        </h3>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <li key={kpi.title}>
                <Card variant="default" className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {kpi.title}
                      </CardTitle>
                      <Icon
                        className="h-4 w-4 text-[#005B7F]"
                        aria-hidden="true"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold tracking-tight">
                      {kpi.value}
                    </p>
                    <CardDescription className="mt-1">
                      {kpi.hint}
                    </CardDescription>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="partner-quick-actions-heading" className="space-y-4">
        <div>
          <h3
            id="partner-quick-actions-heading"
            className="text-lg font-semibold"
          >
            Quick Actions
          </h3>
          <p className="text-sm text-muted-foreground">
            These links explain the available partner sections. They do not create API keys,
            download reports or issue referral credits automatically.
          </p>
        </div>

        <ul className="grid gap-3 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Card variant="interactive" className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {action.label}
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="default" size="default">
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
