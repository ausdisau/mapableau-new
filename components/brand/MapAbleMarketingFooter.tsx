import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import {
  MAPABLE_MARKETING_URL,
  MAPABLE_SUPPORT_EMAIL,
  MAPABLE_TAGLINE,
} from "@/lib/brand/constants";
import { mapablePageContainerClass } from "@/lib/brand/styles";

export function MapAbleMarketingFooter() {
  return (
    <footer
      className="border-t border-slate-200 bg-slate-50 pt-16 pb-8"
      role="contentinfo"
    >
      <div className={mapablePageContainerClass}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4">
              <MapAbleLogo
                href="/"
                variant="full"
                className="hover:opacity-100"
              />
            </div>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {MAPABLE_TAGLINE}
            </p>
            <div
              className="flex gap-4"
              role="list"
              aria-label="Social media links"
            >
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Linkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <span key={label} className="text-muted-foreground" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-heading font-semibold text-foreground">
              Platform
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/care"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Care
                </Link>
              </li>
              <li>
                <Link
                  href="/transport"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Transport
                </Link>
              </li>
              <li>
                <Link
                  href="/employment"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Employment
                </Link>
              </li>
              <li>
                <Link
                  href="/providers"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Providers
                </Link>
              </li>
              <li>
                <Link
                  href={MAPABLE_MARKETING_URL}
                  className="text-muted-foreground transition hover:text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mapable.com.au
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-heading font-semibold text-foreground">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/resources"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Help Centre
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility-statement"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-heading font-semibold text-foreground">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                  className="hover:text-primary"
                >
                  {MAPABLE_SUPPORT_EMAIL}
                </a>
              </li>
              <li>1300 MAP ABLE</li>
              <li>Sydney, Australia</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} Australian Disability Ltd. All rights
            reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/data-deletion" className="hover:text-primary">
              Data deletion
            </Link>
            <Link
              href={MAPABLE_MARKETING_URL}
              className="hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit mapable.com.au
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
