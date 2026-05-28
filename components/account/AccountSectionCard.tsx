import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccountSectionCard({
  title,
  description,
  href,
  hrefLabel = "Open",
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children?: ReactNode;
}) {
  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {href ? (
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link href={href}>{hrefLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
