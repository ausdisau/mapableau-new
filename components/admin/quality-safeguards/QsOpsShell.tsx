import type { ReactNode } from "react";

import { AdminOpsShell } from "@/components/admin/back-of-house/AdminOpsShell";

import { QsNav } from "./QsNav";

export function QsOpsShell({
  title,
  description,
  children,
  breadcrumbExtra,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  breadcrumbExtra?: { label: string; href: string }[];
}) {
  return (
    <AdminOpsShell
      title={title}
      description={description}
      breadcrumb={[
        { label: "Operations", href: "/admin/ops" },
        {
          label: "Quality & Safeguards",
          href: "/admin/ops/quality-safeguards",
        },
        ...(breadcrumbExtra ?? []),
      ]}
    >
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Participant rights first. Automated signals are advisory unless marked
        mandatory. MapAble is not the NDIS regulator, an approved auditor, a
        clinical authority, or a legal adviser.
      </p>
      <QsNav />
      {children}
    </AdminOpsShell>
  );
}
