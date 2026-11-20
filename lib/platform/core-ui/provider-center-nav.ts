import type { PortalNavLink } from "@/components/core/PortalNav";
import { providerCenterPath } from "@/lib/provider/business-host-routing";

/** Suite-style top hubs for Provider Center (Meta Business Suite parallel). */
const PROVIDER_CENTER_HUBS: { subpath: string; label: string; match?: "exact" | "prefix" }[] =
  [
    { subpath: "/", label: "Home", match: "exact" },
    { subpath: "/care", label: "Care" },
    { subpath: "/transport", label: "Transport" },
    { subpath: "/workers", label: "Workforce" },
    { subpath: "/calendar", label: "Calendar" },
    { subpath: "/bookings", label: "Bookings" },
    { subpath: "/claiming", label: "Claiming" },
    { subpath: "/billing", label: "Money" },
    { subpath: "/insights", label: "Insights" },
    { subpath: "/developer", label: "Tools" },
  ];

export function getProviderCenterNavLinks(
  onBusinessHost: boolean,
): PortalNavLink[] {
  return PROVIDER_CENTER_HUBS.map((hub) => ({
    href: providerCenterPath(hub.subpath, onBusinessHost),
    label: hub.label,
    match: hub.match,
  }));
}

export function getProviderCenterHref(
  subpath: string,
  onBusinessHost: boolean,
): string {
  return providerCenterPath(subpath, onBusinessHost);
}
