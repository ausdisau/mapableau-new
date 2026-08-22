"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { AdvertisingUnit } from "@/components/ads/AdvertisingUnit";
import {
  MAPABLE_DONATION_URL,
  MAPABLE_LOGO_WORDMARK_SRC,
  MAPABLE_SUPPORT_EMAIL,
} from "@/lib/brand/constants";
import {
  companyRegistrationDetails,
  footerPlatformLinks,
  footerResourceLinks,
  MAPABLE_CARE_COMBINED_PHONE,
} from "@/lib/marketing/mapable-care-combined-data";

function FooterTextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg text-sm font-medium text-slate-600 transition hover:text-mapable-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary"
    >
      {children}
    </Link>
  );
}

const socialLinks = [
  { href: "https://facebook.com", label: "Facebook", icon: "f" },
  { href: "https://twitter.com", label: "X", icon: "𝕏" },
  { href: "https://instagram.com", label: "Instagram", icon: "◎" },
  { href: "https://linkedin.com", label: "LinkedIn", icon: "in" },
] as const;

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
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black text-slate-600 transition hover:bg-white hover:text-mapable-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary"
    >
      {icon}
    </a>
  );
}

function FooterBrandMark() {
  return (
    <img
      src={MAPABLE_LOGO_WORDMARK_SRC}
      alt="MapAble"
      width={280}
      height={248}
      className="h-16 w-auto max-w-[180px] bg-transparent object-contain object-left"
      decoding="async"
    />
  );
}

function AustralianDisabilityMark() {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black leading-none tracking-tight">
          <span className="text-mapable-primary">A</span>
          <span className="text-mapable-violet">D</span>
        </div>
        <div>
          <p className="text-sm font-black text-mapable-tagline">
            Australian Disability
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">
            We&apos;re for a fair, dignified and equal society for all people
            with disabilities.
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
        <dt className="font-black text-mapable-text">ABN:</dt>
        <dd>{companyRegistrationDetails.abn}</dd>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <dt className="font-black text-mapable-text">NDIS Registration Number:</dt>
        <dd>{companyRegistrationDetails.ndisRegistrationNumber}</dd>
      </div>
    </dl>
  );
}

export function MapAbleCareMarketingFooter() {
  return (
    <footer className="mt-auto border-t border-mapable-border bg-mapable-surface text-mapable-text">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <AdvertisingUnit unitKey="marketing.footer" />
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <section aria-label="About MapAble">
            <FooterBrandMark />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
              A combined care and support platform helping people with
              disability connect with care, transport, opportunity and everyday
              access.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map((link) => (
                <SocialLink
                  key={link.label}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                />
              ))}
            </div>
            <AustralianDisabilityMark />
            <a
              href={MAPABLE_DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-mapable-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary"
            >
              Donate
            </a>
            <RegistrationDetails />
          </section>
          <section aria-labelledby="footer-platform-heading">
            <h2
              id="footer-platform-heading"
              className="text-sm font-black text-mapable-text"
            >
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
            <h2
              id="footer-resources-heading"
              className="text-sm font-black text-mapable-text"
            >
              Resources
            </h2>
            <nav className="mt-5 grid gap-4" aria-label="Resource links">
              {footerResourceLinks.map((item) => (
                <FooterTextLink key={item.href} href={item.href}>
                  {item.label}
                </FooterTextLink>
              ))}
              <FooterTextLink href="/contact">
                Accessibility feedback
              </FooterTextLink>
              <AccessibilityPanelTrigger
                variant="link"
                className="justify-start text-left"
              />
            </nav>
          </section>
          <section aria-labelledby="footer-contact-heading">
            <h2
              id="footer-contact-heading"
              className="text-sm font-black text-mapable-text"
            >
              Contact
            </h2>
            <address className="mt-5 grid gap-4 not-italic text-sm text-slate-600">
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className="rounded-lg transition hover:text-mapable-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary"
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>
              <a
                href="tel:0434083624"
                className="rounded-lg transition hover:text-mapable-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary"
              >
                {MAPABLE_CARE_COMBINED_PHONE}
              </a>
              <span>Sydney, Australia</span>
            </address>
          </section>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-7 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© 2025 Australian Disability Ltd. All rights reserved.</p>
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
  return (
    <footer className="mt-auto border-t border-mapable-border bg-mapable-surface text-mapable-text">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© 2025 Australian Disability Ltd.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Legal links">
          <FooterTextLink href="/privacy">Privacy</FooterTextLink>
          <FooterTextLink href="/terms">Terms</FooterTextLink>
          <FooterTextLink href="/accessibility-statement">
            Accessibility
          </FooterTextLink>
          <AccessibilityPanelTrigger variant="link" />
          <a
            href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
            className="rounded-lg font-medium transition hover:text-mapable-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
