import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import {
  MAPABLE_COMPANY_REGISTRATION,
  MAPABLE_MARKETING_URL,
  MAPABLE_SUPPORT_EMAIL,
  MAPABLE_SUPPORT_PHONE,
  MAPABLE_SUPPORT_PHONE_HREF,
  MAPABLE_TAGLINE,
} from "@/lib/brand/constants";
import { mapablePageContainerClass } from "@/lib/brand/styles";

export function MapAbleMarketingFooter() {
  return (
    <footer
      className="border-t border-slate-200 bg-slate-50 pt-14 pb-8 text-foreground"
      role="contentinfo"
    >
      <div className={mapablePageContainerClass}>
        <div className="mx-auto grid grid-cols-1 gap-12 md:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
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
              className="flex gap-2"
              role="list"
              aria-label="Social media links"
            >
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Linkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white hover:text-primary"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-sm font-black text-[hsl(var(--mapable-yellow))]">
                Australian Disability
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                We are for a fair, dignified and equal society for all people
                with disabilities.
              </p>
            </div>
            <dl className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="font-black text-foreground">ABN:</dt>
                <dd>{MAPABLE_COMPANY_REGISTRATION.abn}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="font-black text-foreground">
                  NDIS Registration Number:
                </dt>
                <dd>{MAPABLE_COMPANY_REGISTRATION.ndisRegistrationNumber}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-black text-foreground">
              Platform
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/provider-finder"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Find care
                </Link>
              </li>
              <li>
                <Link
                  href="/provider-finder?q=transport"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Accessible transport
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/access"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Accessible places
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-black text-foreground">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/ask"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  NDIS help
                </Link>
              </li>
              <li>
                <Link
                  href="/core#civic"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  Public accountability
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  List your service
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  System status
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-black text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                  className="hover:text-primary"
                >
                  {MAPABLE_SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={MAPABLE_SUPPORT_PHONE_HREF}
                  className="hover:text-primary"
                >
                  {MAPABLE_SUPPORT_PHONE}
                </a>
              </li>
              <li>Sydney, Australia</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} Australian Disability Ltd. All rights
            reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-5"
            aria-label="Legal links"
          >
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
            <Link
              href={MAPABLE_MARKETING_URL}
              className="hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit mapable.com.au
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
