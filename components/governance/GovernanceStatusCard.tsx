import Link from "next/link";
import React from "react";

import { Alert } from "@/components/ui/alert";
import type { GovernanceStatus } from "@/lib/governance/types";
import { governanceStatusCopy } from "@/lib/governance/types";

export type GovernanceStatusCardProps = {
  status: GovernanceStatus;
  whyHref?: string;
  live?: boolean;
};

export function GovernanceStatusCard({
  status,
  whyHref = "/resources/understanding-access-needs",
  live = true,
}: GovernanceStatusCardProps) {
  const copy = governanceStatusCopy[status];
  return (
    <Alert variant={copy.variant} title={copy.title} live={live ? "polite" : "off"}>
      <p>{copy.description}</p>
      <p className="mt-2">
        <Link href={whyHref} className="font-semibold text-primary underline-offset-2 hover:underline">
          Why am I seeing this?
        </Link>
      </p>
    </Alert>
  );
}
