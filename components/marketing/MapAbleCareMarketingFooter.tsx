"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { SponsoredBadge } from "@/components/marketing/mapable-care-shared";
import {
  MAPABLE_SOCIAL_LINKS,
  MAPABLE_SUPPORT_EMAIL,
} from "@/lib/brand/constants";
import {
  companyRegistrationDetails,
  footerPlatformLinks,
  footerResourceLinks,
  MAPABLE_CARE_COMBINED_PHONE,
  sponsoredPlacements,
} from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function FooterTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-lg text-sm font-medium text-slate-600 transition hover:text-[#005B7F] ${mapableCareFocusRing}`}
    >
      {children}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-slate-600 transition hover:bg-white hover:text-[#005B7F] ${mapableCareFocusRing}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">
        {label} (opens in a new tab)
      </span>
    </a>
  );
}

function FooterBrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#005B7F] text-white shadow-sm">
        <div className="h-4 w-4 rounded-b-full rounded-tl-full bg-white" />
      </div>
      <span className="text-xl font-black tracking-tight text-[#005B7F]">MapAble</span>
    </div>
  );
}

function AustralianDisabilityMark() {
  return (
    <div
      className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4"
      data-a11y-nonessential
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black leading-none tracking-tight" aria-hidden="true">
          <span className="text-[#2F80C4]">A</span>
          <span className="text-[#2AA6B8]">D</span>
        </div>
        <div>
          <p className="text-sm font-black text-[#7A5A12]">Australian Disability</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">
            We&apos;re for a fair, dignified and equal society for all people with disabilities.
          </p>
        </div>
      </div>
    </div>
  );
}

function RegistrationDetails() {
  return (
    <dl className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <dt className="font-black text-[#0C1833]">ABN:</dt>
        <dd>{companyRegistrationDetails.abn}</dd>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <dt className="font-black text-[#0C1833]">NDIS registration:</dt>
        <dd>
          {companyRegistrationDetails.ndisRegistrationNumber}
          {companyRegistrationDetails.ndisRegistrationNumber === "To be confirmed" ? (
            <>
              {" "}
              —{" "}
              <Link
                href="/accessibility-statement"
                className={`font-semibold text-[#005B7F] underline-offset-2 hover:underline ${mapableCareFocusRing}`}
              >
                status explained
              </Link>
            </>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}

function FooterPartnerStrip() {
  const footerPlacements = sponsoredPlacements.filter((placement) => placement.placement === "footer");
  if (footerPlacements.length === 0) return null;
  return (
    <div
      className="mb-10 rounded-[1.5rem] border border-slate-200 bg-white p-5"
      data-a11y-nonessential
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <SponsoredBadge>Community partners</SponsoredBadge>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Partner placements are separated from support results and labelled for transparency.
          </p>
        </div>
        <div className="grid gap-3 md:min-w-[24rem]">
          {footerPlacements.map((placement) => (
            <Link
              key={placement.id}
              href={placement.href}
              className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-[#F8C51C]/15 ${mapableCareFocusRing}`}
            >
              <span className="block text-sm font-black text-[#0C1833]">{placement.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                {placement.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function copyrightYear(): number {
  return new Date().getFullYear();
}

export function MapAbleCareMarketingFooter() {
  const year = copyrightYear();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-[#0C1833]">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <FooterPartnerStrip />
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <section aria-label="About MapAble">
            <FooterBrandMark />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
              A combined care and support platform helping people with disability connect with care,
              transport, opportunity and everyday access.
            </p>
            {MAPABLE_SOCIAL_LINKS.length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {MAPABLE_SOCIAL_LINKS.map((link) => (
                  <SocialLink
                    key={link.label}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                  />
                ))}
              </div>
            ) : null}
            <AustralianDisabilityMark />
            <RegistrationDetails />
          </section>
          <section aria-labelledby="footer-platform-heading">
            <h2 id="footer-platform-heading" className="text-sm font-black text-[#0C1833]">
              Platform
            </h2>
            <nav className="mt-5 grid gap-4" aria-label="Platform links">
              {footerPlatformLinks.map((item) => (
                <FooterTextLink key={item.href} href={item.href}>
                  {item.label}
                </FooterTextLink>
              ))}
            </nav>
          </section>
          <section aria-labelledby="footer-resources-heading">
            <h2 id="footer-resources-heading" className="text-sm font-black text-[#0C1833]">
              Resources
            </h2>
            <nav className="mt-5 grid gap-4" aria-label="Resource links">
              {footerResourceLinks.map((item) => (
                <FooterTextLink key={item.href} href={item.href}>
                  {item.label}
                </FooterTextLink>
              ))}
              <FooterTextLink href="/contact">Accessibility feedback</FooterTextLink>
              <AccessibilityPanelTrigger variant="link" className="justify-start text-left" />
            </nav>
          </section>
          <section aria-labelledby="footer-contact-heading">
            <h2 id="footer-contact-heading" className="text-sm font-black text-[#0C1833]">
              Contact
            </h2>
            <address className="mt-5 grid gap-4 not-italic text-sm text-slate-600">
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className={`rounded-lg transition hover:text-[#005B7F] ${mapableCareFocusRing}`}
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>
              <a
                href="tel:0434083624"
                className={`rounded-lg transition hover:text-[#005B7F] ${mapableCareFocusRing}`}
              >
                {MAPABLE_CARE_COMBINED_PHONE}
              </a>
              <span>Sydney, Australia</span>
            </address>
          </section>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-7 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {year} Australian Disability Ltd. All rights reserved.</p>
          <nav className="flex gap-6" aria-label="Legal links">
            <FooterTextLink href="/privacy">Privacy Policy</FooterTextLink>
            <FooterTextLink href="/terms">Terms of Service</FooterTextLink>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function MapAbleCareSlimFooter() {
  const year = copyrightYear();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-[#0C1833]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© {year} Australian Disability Ltd.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Legal links">
          <FooterTextLink href="/privacy">Privacy</FooterTextLink>
          <FooterTextLink href="/terms">Terms</FooterTextLink>
          <FooterTextLink href="/accessibility-statement">Accessibility</FooterTextLink>
          <AccessibilityPanelTrigger variant="link" />
          <a
            href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
            className={`rounded-lg font-medium transition hover:text-[#005B7F] ${mapableCareFocusRing}`}
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
