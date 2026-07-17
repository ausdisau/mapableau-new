import { notFound } from "next/navigation";

import { requireAdminScope } from "@/lib/auth/guards";
import { isQualitySafeguardsOpsEnabled } from "@/lib/quality-safeguards/feature-flags";

export const dynamic = "force-dynamic";

export default async function QualitySafeguardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isQualitySafeguardsOpsEnabled()) {
    notFound();
  }
  await requireAdminScope("qs:ops:read");
  return children;
}
