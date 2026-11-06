import Link from "next/link";
import { notFound } from "next/navigation";

import { DomainServicesSetupWizard } from "@/components/domain-services/DomainServicesSetupWizard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import {
  domainServicesConfig,
  isDomainServicesSelfServeEnabled,
} from "@/lib/config/domain-services";

export const metadata = {
  title: "Domain Services setup | MapAble",
  description:
    "Register a provider organisation and draft white-label hosting preview on MapAble Domain Services.",
};

export default function DomainServicesSetupPage() {
  if (!isDomainServicesSelfServeEnabled()) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <CorePageHeader
        eyebrow="MapAble Domain Services"
        title="Provider cloud hosting registration"
        description="Create a draft white-label tenant preview. Hostnames are branding-only — DNS, Vercel attach, and cPanel remain NOT CONFIGURED."
      />
      <DomainServicesSetupWizard
        hostSuffix={domainServicesConfig.proposedHostSuffix}
      />
      <p className="text-sm text-muted-foreground">
        Prefer to talk first?{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Contact MapAble
        </Link>
        .
      </p>
    </div>
  );
}
