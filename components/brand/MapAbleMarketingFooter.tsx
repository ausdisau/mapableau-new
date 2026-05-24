import Link from "next/link";

import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import { FooterRegistrationDetails } from "@/components/marketing/mapable/FooterRegistrationDetails";
import { FooterPartnerStrip } from "@/components/marketing/mapable/FooterPartnerStrip";
import {
  MAPABLE_FOOTER_POSITIONING,
  MAPABLE_MARKETING_URL,
} from "@/lib/brand/constants";
import { mapablePageContainerClass } from "@/lib/brand/styles";

const PLATFORM_LINKS = [
  { href: "/provider-finder", label: "Provider Finder" },
  { href: "/ask", label: "Ask MapAble" },
  { href: "/core", label: "MapAble Core" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

const RESOURCE_LINKS = [
  { href: "/provider-finder#how-it-works", label: "How it works" },
  { href: "/status", label: "System status" },
  { href: MAPABLE_MARKETING_URL, label: "mapable.com.au", external: true },
] as const;

export function MapAbleMarketingFooter() {
  return (
    <footer
      className="border-t border-slate-200 bg-slate-50 pt-16 pb-8"
      role="contentinfo"
    >
      <div className={mapablePageContainerClass}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <MapAbleLogo href="/" variant="full" className="hover:opacity-100" />
            <p className="mapable-soft mb-6 mt-4 text-sm leading-relaxed text-slate-600">
              {MAPABLE_FOOTER_POSITIONING}
            </p>
            <FooterRegistrationDetails />
          </div>

          <nav aria-labelledby="footer-platform-heading">
            <h2
              id="footer-platform-heading"
              className="mapable-display mb-4 text-sm font-semibold text-mapable-navy"
            >
              Platform
            </h2>
            <ul className="mapable-soft space-y-3 text-sm">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="mapable-focus-ring rounded text-slate-600 hover:text-mapable-blue"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-resources-heading">
            <h2
              id="footer-resources-heading"
              className="mapable-display mb-4 text-sm font-semibold text-mapable-navy"
            >
              Resources
            </h2>
            <ul className="mapable-soft space-y-3 text-sm">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="mapable-focus-ring rounded text-slate-600 hover:text-mapable-blue"
                    {...("external" in link && link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mapable-display mb-4 text-sm font-semibold text-mapable-navy">
              Legal
            </h2>
            <ul className="mapable-soft space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="mapable-focus-ring rounded text-slate-600 hover:text-mapable-blue"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="mapable-focus-ring rounded text-slate-600 hover:text-mapable-blue"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <FooterPartnerStrip />

        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} Australian Disability Ltd. All rights reserved.</p>
          <p className="mapable-soft">MapAble — Care and support, connected.</p>
        </div>
      </div>
    </footer>
  );
}
