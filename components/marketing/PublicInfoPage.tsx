import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  mapableEyebrowBadgeClass,
  mapablePageContainerClass,
} from "@/lib/brand/styles";

export type PublicInfoSection = {
  title: string;
  content: ReactNode;
};

export function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
  ctaLabel = "Contact MapAble",
  ctaHref = "/contact",
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PublicInfoSection[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.08] via-background to-background py-14 sm:py-20">
        <div className={`${mapablePageContainerClass} max-w-4xl`}>
          <Badge variant="outline" className={mapableEyebrowBadgeClass}>
            {eyebrow}
          </Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
          <Button asChild variant="default" size="lg" className="mt-8">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </section>

      <section className={`${mapablePageContainerClass} max-w-4xl py-12`}>
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
