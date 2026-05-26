import type { PortalNavLink } from "@/components/core/PortalNav";

/** How a product module mounts in the App Router. */
export type ModuleShell = "public" | "core" | "portal" | "dashboard" | "admin";

export type ProductModule = {
  key: string;
  name: string;
  href: string;
  shell: ModuleShell;
  /** Primary lib folder for domain logic (convention, not enforced). */
  libPath?: string;
};

export type PortalModuleConfig = {
  key: string;
  title: string;
  links: PortalNavLink[];
  backHref?: string;
  backLabel?: string;
};
