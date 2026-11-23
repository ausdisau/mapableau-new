import {
  getProviderCloudHost,
  getProviderCloudOperationsSnapshot,
  providerCloudConfig,
} from "@/lib/config/providercloud";

export const PROVIDERCLOUD_WRITERS = [
  {
    id: "care",
    title: "Care",
    href: "/provider/care",
    purpose: "Service requests, shifts, and rostering",
  },
  {
    id: "transport",
    title: "Transport",
    href: "/provider/transport",
    purpose: "Trip dispatch and ride runs",
  },
  {
    id: "billing",
    title: "Billing",
    href: "/provider/billing",
    purpose: "Invoices and reconciliation",
  },
  {
    id: "workforce",
    title: "Workforce",
    href: "/provider/workers",
    purpose: "Worker profiles and credentials",
  },
  {
    id: "continuity",
    title: "Continuity",
    href: "/provider-ops",
    purpose: "Read-only attention projection when flagged on",
  },
] as const;

export function buildProviderCloudStatus(
  env: NodeJS.ProcessEnv = process.env,
) {
  const operations = getProviderCloudOperationsSnapshot(env);

  return {
    serviceId: providerCloudConfig.serviceId,
    title: providerCloudConfig.title,
    host: getProviderCloudHost(env),
    identityStatus: providerCloudConfig.identityStatus,
    surface: "hosted_read_only" as const,
    authorityCeiling: providerCloudConfig.authorityCeiling,
    productionClaimStatus: providerCloudConfig.productionClaimStatus,
    maturity: providerCloudConfig.maturity,
    operations,
    writers: PROVIDERCLOUD_WRITERS,
    notice:
      "Hosted ProviderCloud surface on the existing MapAble deployment. Supplier operations stay disabled. This is not a premium listing or pay-to-rank product. Attention writers remain in Care, Transport, Billing, Workforce, and Continuity.",
  };
}
