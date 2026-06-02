import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  mapableEyebrowBadgeClass,
  mapablePageContainerClass,
} from "@/lib/brand/styles";

type CallToAction = {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline";
};

export type PublicModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  whoFor: string[];
  availableNow: string[];
  comingSoon: string[];
  safetyNote: ReactNode;
  primaryCta: CallToAction;
  secondaryCta?: CallToAction;
};

export function PublicModulePage({
  eyebrow,
  title,
  description,
  whoFor,
  availableNow,
  comingSoon,
  safetyNote,
  primaryCta,
  secondaryCta,
}: PublicModulePageProps) {
  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.08] via-background to-background py-14 sm:py-20">
        <div className={`${mapablePageContainerClass} max-w-6xl`}>
          <div className="max-w-3xl">
            <Badge variant="outline" className={mapableEyebrowBadgeClass}>
              {eyebrow}
            </Badge>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant={primaryCta.variant ?? "default"}
                size="lg"
              >
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {secondaryCta ? (
                <Button
                  asChild
                  variant={secondaryCta.variant ?? "outline"}
                  size="lg"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={`${mapablePageContainerClass} max-w-6xl py-12`}>
        <div className="grid gap-6 lg:grid-cols-3">
          <InfoCard
            title="Who it is for"
            description="The people and teams this module is designed to support."
            items={whoFor}
          />
          <InfoCard
            title="Available now"
            description="Safe public-facing capabilities in the current pilot build."
            items={availableNow}
          />
          <InfoCard
            title="Coming soon"
            description="Planned capabilities that are not yet production claims."
            items={comingSoon}
          />
        </div>

        <Card className="mt-8 border-primary/20 bg-primary/[0.04]">
          <CardHeader>
            <CardTitle>Privacy and safety note</CardTitle>
            <CardDescription>
              MapAble is being built as a disability support operating system
              with consent, verification and audit controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-7 text-muted-foreground">
              {safetyNote}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function InfoCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
