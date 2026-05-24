import Link from "next/link";

import { FooterPartnerStrip } from "@/components/marketing/mapable/FooterPartnerStrip";
import { FooterRegistrationDetails } from "@/components/marketing/mapable/FooterRegistrationDetails";
import { MapAbleLogo } from "@/components/marketing/mapable/MapAbleLogo";
import {
  MAPABLE_FOOTER_POSITIONING,
  MAPABLE_LOCATION,
  MAPABLE_MARKETING_URL,
  MAPABLE_SUPPORT_EMAIL,
  MAPABLE_SUPPORT_PHONE,
  MAPABLE_SUPPORT_PHONE_HREF,
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

/**
 * Marketing-only footer with registration and contact details.
 */
export function MarketingFooter() {
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
                    className="mapable-focus-ring inline-flex min-h-10 items-center rounded text-slate-600 hover:text-mapable-blue"
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
                    className="mapable-focus-ring inline-flex min-h-10 items-center rounded text-slate-600 hover:text-mapable-blue"
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
              Legal & contact
            </h2>
            <ul className="mapable-soft mb-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="mapable-focus-ring inline-flex min-h-10 items-center rounded text-slate-600 hover:text-mapable-blue"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="mapable-focus-ring inline-flex min-h-10 items-center rounded text-slate-600 hover:text-mapable-blue"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
            <address className="mapable-soft not-italic text-sm text-slate-600">
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className="mapable-focus-ring block min-h-10 py-1 text-mapable-blue hover:underline"
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>
              <a
                href={MAPABLE_SUPPORT_PHONE_HREF}
                className="mapable-focus-ring block min-h-10 py-1 text-mapable-blue hover:underline"
              >
                {MAPABLE_SUPPORT_PHONE}
              </a>
              <span className="block py-1">{MAPABLE_LOCATION}</span>
            </address>
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
