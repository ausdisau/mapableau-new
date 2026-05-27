import type { ProductModule } from "@/lib/platform/types";

/** Canonical product modules — routes, shells, and lib ownership. */
export const PRODUCT_MODULES: ProductModule[] = [
  {
    key: "access",
    name: "MapAble Access",
    href: "/access",
    shell: "public",
    libPath: "lib/access-map",
  },
  {
    key: "peers",
    name: "MapAble PEERS",
    href: "/peers",
    shell: "core",
    libPath: "lib/mapable-peers",
  },
  {
    key: "care",
    name: "MapAble Care",
    href: "/care",
    shell: "portal",
    libPath: "lib/care",
  },
  {
    key: "provider",
    name: "Provider console",
    href: "/provider/bookings",
    shell: "portal",
    libPath: "lib/care",
  },
  {
    key: "worker",
    name: "Worker",
    href: "/worker/today",
    shell: "portal",
  },
  {
    key: "employer",
    name: "Employer",
    href: "/employer/jobs",
    shell: "portal",
  },
  {
    key: "driver",
    name: "MapAble Driver",
    href: "/driver/trips",
    shell: "portal",
  },
  {
    key: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    shell: "dashboard",
  },
  {
    key: "admin",
    name: "Admin",
    href: "/admin",
    shell: "admin",
  },
  {
    key: "billing",
    name: "Billing",
    href: "/billing",
    shell: "core",
    libPath: "lib/billing-core",
  },
  {
    key: "ask",
    name: "Ask MapAble",
    href: "/ask",
    shell: "core",
    libPath: "lib/copilot",
  },
];

export function getProductModule(key: string): ProductModule | undefined {
  return PRODUCT_MODULES.find((m) => m.key === key);
}

export function modulesByShell(shell: ProductModule["shell"]): ProductModule[] {
  return PRODUCT_MODULES.filter((m) => m.shell === shell);
}
