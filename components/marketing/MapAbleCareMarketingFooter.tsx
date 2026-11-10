"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { AdvertisingUnit } from "@/components/ads/AdvertisingUnit";
import { MapAbleBrandLockup } from "@/components/brand/MapAbleBrandLockup";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import {
  companyRegistrationDetails,
  footerPlatformLinks,
  footerResourceLinks,
  MAPABLE_CARE_COMBINED_PHONE,
} from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type FooterGroupId = "platform" | "resources" | "contact";

function useDismissOnOutsideAndEscape(
  open: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, onClose, open]);
}

function FooterTextLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg text-sm font-medium text-slate-600 transition hover:text-[#3B5BDB] ${mapableCareFocusRing}`}
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-slate-600 transition hover:bg-white hover:text-[#3B5BDB] ${mapableCareFocusRing}`}
    >
      {icon}
    </a>
  );
}

function AustralianDisabilityMark() {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black leading-none tracking-tight">
          <span className="text-[#2F80C4]">A</span>
          <span className="text-[#2AA6B8]">D</span>
        </div>
        <div>
          <p className="text-sm font-black text-[#7A5A12]">
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
        <dt className="font-black text-[#0C1833]">ABN:</dt>
        <dd>{companyRegistrationDetails.abn}</dd>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <dt className="font-black text-[#0C1833]">NDIS Registration Number:</dt>
        <dd>{companyRegistrationDetails.ndisRegistrationNumber}</dd>
      </div>
    </dl>
  );
}

const utilityOutlineClass = `inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#0C1833] px-4 text-sm font-black text-[#0C1833] transition hover:bg-[#F7F8FC] ${mapableCareFocusRing}`;

const primaryBandLinkClass = `inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-white/95 transition hover:bg-white/10 ${mapableCareFocusRing}`;

const FOOTER_GROUPS: {
  id: FooterGroupId;
  label: string;
}[] = [
  { id: "platform", label: "Platform" },
  { id: "resources", label: "Resources" },
  { id: "contact", label: "Contact" },
];

function FooterAboutSection() {
  return (
    <section aria-label="About MapAble">
      <MapAbleBrandLockup
        href="/"
        size="footer"
        align="start"
        className="hover:opacity-100"
      />
      <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
        A combined care and support platform helping people with disability
        connect with care, transport, opportunity and everyday access.
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
      <RegistrationDetails />
    </section>
  );
}

function FooterPlatformSection({ onNavigate }: { onNavigate: () => void }) {
  return (
    <section aria-labelledby="footer-platform-heading">
      <h2
        id="footer-platform-heading"
        className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3B5BDB]"
      >
        Platform
      </h2>
      <nav className="mt-3 grid gap-3" aria-label="Platform links">
        {footerPlatformLinks.map((item) => (
          <FooterTextLink
            key={item.href}
            href={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </FooterTextLink>
        ))}
      </nav>
    </section>
  );
}

function FooterResourcesSection({ onNavigate }: { onNavigate: () => void }) {
  return (
    <section aria-labelledby="footer-resources-heading">
      <h2
        id="footer-resources-heading"
        className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3B5BDB]"
      >
        Resources
      </h2>
      <nav className="mt-3 grid gap-3" aria-label="Resource links">
        {footerResourceLinks.map((item) => (
          <FooterTextLink
            key={item.href}
            href={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </FooterTextLink>
        ))}
        <FooterTextLink href="/contact" onClick={onNavigate}>
          Accessibility feedback
        </FooterTextLink>
        <AccessibilityPanelTrigger
          variant="link"
          className="justify-start text-left"
        />
      </nav>
    </section>
  );
}

function FooterContactSection() {
  const phoneHref = `tel:${MAPABLE_CARE_COMBINED_PHONE.replace(/\s+/g, "")}`;

  return (
    <section aria-labelledby="footer-contact-heading">
      <h2
        id="footer-contact-heading"
        className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3B5BDB]"
      >
        Contact
      </h2>
      <address className="mt-3 grid gap-3 not-italic text-sm text-slate-600">
        <a
          href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
          className={`rounded-lg transition hover:text-[#3B5BDB] ${mapableCareFocusRing}`}
        >
          {MAPABLE_SUPPORT_EMAIL}
        </a>
        <a
          href={phoneHref}
          className={`rounded-lg transition hover:text-[#3B5BDB] ${mapableCareFocusRing}`}
        >
          {MAPABLE_CARE_COMBINED_PHONE}
        </a>
        <span>Sydney, Australia</span>
      </address>
    </section>
  );
}

function FooterLegalRow({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
      <p>© 2025 Australian Disability Ltd. All rights reserved.</p>
      <nav className="flex gap-6" aria-label="Legal links">
        <FooterTextLink href="/privacy" onClick={onNavigate}>
          Privacy Policy
        </FooterTextLink>
        <FooterTextLink href="/terms" onClick={onNavigate}>
          Terms of Service
        </FooterTextLink>
      </nav>
    </div>
  );
}

/**
 * Viewport-fixed marketing footer chrome (mirrors header DPO layers):
 * docked expand panel → navy band → utility strip → brand/actions row.
 */
export function MapAbleCareMarketingFooter() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupOpenId, setGroupOpenId] = useState<FooterGroupId | null>(null);
  const [chromeHeight, setChromeHeight] = useState(72);
  const chromeRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const anyPanelOpen = mobileOpen || groupOpenId !== null;
  const dismissAll = () => {
    setMobileOpen(false);
    setGroupOpenId(null);
  };

  useDismissOnOutsideAndEscape(anyPanelOpen, dismissAll, chromeRef);
  // Panel sits above the bar in the visual stack but before the Menu/group
  // triggers in DOM order — trap moves focus into panel links on open and
  // restores the trigger on close (Escape / outside click).
  useFocusTrap(panelRef, anyPanelOpen);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === "undefined") return;

    const update = () => {
      setChromeHeight(Math.ceil(bar.getBoundingClientRect().height));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [mobileOpen, groupOpenId]);

  const phoneHref = `tel:${MAPABLE_CARE_COMBINED_PHONE.replace(/\s+/g, "")}`;
  const panelId = "marketing-footer-docked-panel";

  return (
    <footer className="mt-auto text-[#0C1833]">
      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <AdvertisingUnit unitKey="marketing.footer" />
      </div>

      <div
        aria-hidden
        className="shrink-0"
        style={{ height: chromeHeight }}
      />

      <div
        ref={chromeRef}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white"
      >
        {anyPanelOpen ? (
          <div
            ref={panelRef}
            id={panelId}
            className="absolute inset-x-0 bottom-full max-h-[min(70vh,36rem)] overflow-y-auto border-t border-slate-200 bg-[#F7F8FC]"
            role="region"
            aria-label="Footer navigation"
            tabIndex={-1}
          >
            <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
              {mobileOpen ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  <FooterAboutSection />
                  <FooterPlatformSection onNavigate={dismissAll} />
                  <FooterResourcesSection onNavigate={dismissAll} />
                  <FooterContactSection />
                </div>
              ) : null}

              {!mobileOpen && groupOpenId ? (
                <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                  <FooterAboutSection />
                  {groupOpenId === "platform" ? (
                    <FooterPlatformSection onNavigate={dismissAll} />
                  ) : null}
                  {groupOpenId === "resources" ? (
                    <FooterResourcesSection onNavigate={dismissAll} />
                  ) : null}
                  {groupOpenId === "contact" ? <FooterContactSection /> : null}
                </div>
              ) : null}

              <FooterLegalRow onNavigate={dismissAll} />
            </div>
          </div>
        ) : null}

        <div ref={barRef}>
          <nav
            aria-label="Footer primary"
            className="relative hidden overflow-visible border-b border-[#0C1833]/10 bg-[#0C1833] min-[920px]:block"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-1 sm:px-5 lg:px-8">
              {FOOTER_GROUPS.map((group) => {
                const open = groupOpenId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`${primaryBandLinkClass} ${open ? "bg-white/15" : ""}`}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => {
                      setMobileOpen(false);
                      setGroupOpenId(open ? null : group.id);
                    }}
                  >
                    {group.label}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="hidden border-b border-white/10 bg-[#0C1833] text-white md:block">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs font-semibold sm:px-5 lg:px-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <a
                  href={phoneHref}
                  className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
                >
                  {MAPABLE_CARE_COMBINED_PHONE}
                </a>
                <a
                  href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                  className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
                >
                  {MAPABLE_SUPPORT_EMAIL}
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link
                  href="/contact"
                  className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
                  onClick={dismissAll}
                >
                  Contact us
                </Link>
                <Link
                  href="/accessibility-statement"
                  className={`inline-flex min-h-11 items-center rounded-md px-1 text-white/90 hover:text-white ${mapableCareFocusRing}`}
                  onClick={dismissAll}
                >
                  Accessibility statement
                </Link>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
            <MapAbleBrandLockup
              href="/"
              size="header"
              className={`min-w-0 shrink overflow-visible hover:bg-slate-50 hover:opacity-100 ${mapableCareFocusRing}`}
              ariaLabel="MapAble home — Empowering Independence"
              onClick={dismissAll}
            />

            <div className="flex items-center gap-2 md:gap-3">
              <Link
                href="/contact"
                className={`${utilityOutlineClass} hidden sm:inline-flex`}
                onClick={dismissAll}
              >
                Contact
              </Link>
              <div className="hidden md:block">
                <AccessibilityPanelTrigger />
              </div>
              <button
                type="button"
                aria-expanded={mobileOpen}
                aria-controls={panelId}
                onClick={() => {
                  setGroupOpenId(null);
                  setMobileOpen(!mobileOpen);
                }}
                className={`inline-flex min-h-11 items-center rounded-full border-2 border-[#0C1833] px-4 text-sm font-black min-[920px]:hidden ${mapableCareFocusRing}`}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MapAbleCareSlimFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-[#0C1833]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© 2025 Australian Disability Ltd.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Legal links">
          <FooterTextLink href="/privacy">Privacy</FooterTextLink>
          <FooterTextLink href="/terms">Terms</FooterTextLink>
          <FooterTextLink href="/accessibility-statement">
            Accessibility statement
          </FooterTextLink>
          <AccessibilityPanelTrigger variant="link" />
          <a
            href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
            className={`rounded-lg font-medium transition hover:text-[#3B5BDB] ${mapableCareFocusRing}`}
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
