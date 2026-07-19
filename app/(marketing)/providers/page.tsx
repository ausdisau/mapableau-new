import type { Metadata } from "next";

import { ProviderDirectory } from "@/components/providers/ProviderDirectory";

export const metadata: Metadata = {
  title: "Providers",
  description:
    "Find disability support providers with availability, access-readiness, transport feasibility, and evidence status.",
};

export default function ProvidersPage() {
  // Shell comes from app/(marketing)/layout.tsx — do not nest another marketing shell.
  return <ProviderDirectory />;
}
