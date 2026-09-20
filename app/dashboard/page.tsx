import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  BriefcaseBusiness,
  BusFront,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

import { SpeechifyReadAloudButton } from "@/components/accessibility/SpeechifyReadAloudButton";
import { adaptParticipantDashboard } from "@/lib/access/adaptive";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { caseListWhereForUser } from "@/lib/cases/case-access";
import { caseManagementConfig } from "@/lib/config/case-management";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { countOpenSubmissions } from "@/lib/engagement/engagement-submission-service";
import { prisma } from "@/lib/prisma";
import { isSpeechifyConfigured } from "@/lib/speechify/tts";

export const metadata = { title: "Control panel | MapAble Core" };

function SummaryCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#DCE8EB] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#526574]">{label}</p>
          <p className="mt-2 font-heading text-3xl font-bold text-[#0C1833]">{value}</p>
          <p className="mt-1 text-sm text-[#526574]">{hint}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#E9F5F7] text-[#005B7F]">
          {icon}
        </span>
      </div>
    </div>
  );
}

function DashboardLinkCard({
  href,
  title,
  description,
  icon,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col rounded-2xl border border-[#DCE8EB] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8CCAD9] hover:shadow-md focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C] motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-[#E9F5F7] text-[#005B7F]">
          {icon}
        </span>
        {badge ? (
          <span className="rounded-full bg-[#FFF3C7] px-2.5 py-1 text-xs font-bold text-[#674E00]">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="mt-4 font-heading text-lg font-bold text-[#0C1833]">{title}</h2>
      <p className="mt-1 flex-1 text-sm leading-6 text-[#526574]">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#005B7F]">
        Open <ChevronRight size={16} aria-hidden="true" />
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();

  const [
    profile,
    bookingsCount,
    careBookingsCount,
    transportTripsCount,
    unreadNotifications,
    incidentCount,
    openSupportCount,
    openCaseCount,
    openEngagementCount,
  ] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId: user.id } }),
    prisma.booking.count({ where: { participantId: user.id } }),
    prisma.careBooking.count({ where: { participantId: user.id } }),
    prisma.transportTrip.count({ where: { participantId: user.id } }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
    prisma.incidentReport.count({
      where: {
        OR: [{ participantId: user.id }, { reportedById: user.id }],
      },
    }),
    prisma.supportTicket.count({
      where: {
        OR: [{ createdById: user.id }, { participantId: user.id }],
        status: { notIn: ["resolved", "closed"] },
      },
    }),
    caseManagementConfig.enabled
      ? prisma.case.count({
          where: {
            AND: [
              caseListWhereForUser(user.id, user.primaryRole),
              { status: { not: "closed" } },
            ],
          },
        })
      : Promise.resolve(0),
    isEngagementPlatformEnabled()
      ? countOpenSubmissions(user.id)
      : Promise.resolve(0),
  ]);

  const presentation = adaptParticipantDashboard({ profile: null });
  const densityClass =
    presentation.applied &&
    presentation.policy?.informationDensity === "low"
      ? "max-w-5xl space-y-8"
      : "max-w-7xl space-y-8";

  const firstName = user.name.split(/\s+/)[0] || user.name;
  const safetyCount = incidentCount + openSupportCount;
  const engagementEnabled = isEngagementPlatformEnabled();
  const speechifyEnabled = isSpeechifyConfigured();
  const readAloudText =
    "Welcome to MapAble Core. Coordinate access, care, transport, work and support from one place. You remain in control of consent, choices and approvals.";

  return (
    <div
      className={densityClass}
      data-adapt-runtime={presentation.applied ? "on" : "off"}
      data-adapt-variant={presentation.policy?.componentVariant ?? "default"}
    >
      <section className="overflow-hidden rounded-3xl bg-[#005B7F] text-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#CDEAF0]">
              MapAble Core
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#E7F7FA]">
              Coordinate access, care, transport, work and support from one place.
              You remain in control of consent, choices and approvals.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#CDEAF0]">
              Signed in as {roleLabel(user.primaryRole)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:max-w-xs lg:justify-end">
            <Link
              href="/ask"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#F8C51C] px-5 py-3 font-bold text-[#0C1833] transition hover:bg-[#FFDA52] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            >
              <Sparkles size={19} aria-hidden="true" /> Ask MapAble
            </Link>
            {speechifyEnabled ? (
              <SpeechifyReadAloudButton text={readAloudText} label="Listen" />
            ) : null}
            <Link
              href="/provider-finder"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/50 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C] motion-reduce:transition-none"
            >
              <HeartHandshake size={19} aria-hidden="true" /> Find support
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-summary-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#005B7F]">
              At a glance
            </p>
            <h2 id="dashboard-summary-heading" className="mt-1 font-heading text-2xl font-bold text-[#0C1833]">
              Your MapAble activity
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Bookings"
            value={bookingsCount}
            hint="Booking requests"
            icon={<CheckCircle2 size={22} aria-hidden="true" />}
          />
          <SummaryCard
            label="Care"
            value={careBookingsCount}
            hint="Care bookings"
            icon={<HeartHandshake size={22} aria-hidden="true" />}
          />
          <SummaryCard
            label="Transport"
            value={transportTripsCount}
            hint="Scheduled trips"
            icon={<BusFront size={22} aria-hidden="true" />}
          />
          <SummaryCard
            label="Notifications"
            value={unreadNotifications}
            hint={unreadNotifications ? "Unread updates" : "Nothing unread"}
            icon={<Bell size={22} aria-hidden="true" />}
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#DCE8EB] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#005B7F]">
                Safety and human support
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-[#0C1833]">
                {safetyCount ? "Items need your attention" : "No open safety items"}
              </h2>
            </div>
            <span
              className={
                safetyCount
                  ? "rounded-full bg-[#FFF3C7] px-3 py-1.5 text-sm font-bold text-[#674E00]"
                  : "rounded-full bg-[#DDF5EB] px-3 py-1.5 text-sm font-bold text-[#0D684D]"
              }
            >
              {safetyCount ? String(safetyCount) + " open" : "Clear"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#F6FBFC] p-4">
              <p className="text-sm font-semibold text-[#526574]">Incident reports</p>
              <p className="mt-1 font-heading text-2xl font-bold text-[#0C1833]">{incidentCount}</p>
            </div>
            <div className="rounded-xl bg-[#F6FBFC] p-4">
              <p className="text-sm font-semibold text-[#526574]">Open support tickets</p>
              <p className="mt-1 font-heading text-2xl font-bold text-[#0C1833]">{openSupportCount}</p>
            </div>
          </div>
          <Link
            href="/dashboard/safety"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0C1833] px-4 py-2.5 text-sm font-bold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C]"
          >
            <ShieldCheck size={18} aria-hidden="true" /> Open safety centre
          </Link>
        </div>

        <div className="rounded-2xl border border-[#DCE8EB] bg-[#F6FBFC] p-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#005B7F]">
            Participant control
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-[#0C1833]">
            Your preferences travel with you
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#526574]">
            Review accessibility preferences, consent and profile information before
            sharing it across MapAble services.
          </p>
          <div className="mt-5 space-y-2">
            {[
              ["Accessibility preferences", "/dashboard/accessibility"],
              ["Consent and information sharing", "/dashboard/consent"],
              [profile ? "Profile: " + profile.displayName : "Set up your profile", "/dashboard/profile"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center justify-between rounded-xl border border-[#CFE1E5] bg-white px-4 py-3 text-sm font-bold text-[#0C1833] hover:border-[#8CCAD9] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C]"
              >
                <span>{label}</span>
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="services-heading">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#005B7F]">Services</p>
        <h2 id="services-heading" className="mt-1 font-heading text-2xl font-bold text-[#0C1833]">
          Coordinate what you need
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardLinkCard
            href="/care/bookings"
            title="Care & providers"
            description="Request disability supports, review care bookings and track service delivery."
            icon={<HeartHandshake size={22} aria-hidden="true" />}
            badge={careBookingsCount ? String(careBookingsCount) + " booking" + (careBookingsCount === 1 ? "" : "s") : undefined}
          />
          <DashboardLinkCard
            href="/dashboard/transport"
            title="Accessible routing"
            description="Plan and track transport with your mobility and access requirements in view."
            icon={<BusFront size={22} aria-hidden="true" />}
            badge={transportTripsCount ? String(transportTripsCount) + " trip" + (transportTripsCount === 1 ? "" : "s") : undefined}
          />
          <DashboardLinkCard
            href="/dashboard/jobs"
            title="Employment hub"
            description="Explore work and study pathways while controlling what accessibility information you share."
            icon={<BriefcaseBusiness size={22} aria-hidden="true" />}
          />
          <DashboardLinkCard
            href="/messages"
            title="Unified inbox"
            description="Continue secure, consent-aware conversations across MapAble services."
            icon={<MessageSquare size={22} aria-hidden="true" />}
          />
          <DashboardLinkCard
            href="/dashboard/billing"
            title="Billing centre"
            description="Review invoices, funding sources and payment records without hiding transaction detail."
            icon={<WalletCards size={22} aria-hidden="true" />}
          />
          <DashboardLinkCard
            href="/dashboard/careos"
            title="My CareOS"
            description="Coordinate care and transport with participant-controlled recommendations and human review."
            icon={<Sparkles size={22} aria-hidden="true" />}
          />
          <DashboardLinkCard
            href="/provider-finder"
            title="Find verified support"
            description="Search provider information and suitability evidence without treating a listing as an automatic endorsement."
            icon={<MapPin size={22} aria-hidden="true" />}
          />
          <DashboardLinkCard
            href="/dashboard/notifications"
            title="Notifications"
            description="Review service, account and coordination updates in one place."
            icon={<Bell size={22} aria-hidden="true" />}
            badge={unreadNotifications ? String(unreadNotifications) + " unread" : undefined}
          />
          <DashboardLinkCard
            href="/dashboard/profile"
            title="Profile"
            description="Manage the identity and participant information used across authorised MapAble workflows."
            icon={<UserRound size={22} aria-hidden="true" />}
          />
          {engagementEnabled ? (
            <DashboardLinkCard
              href="/dashboard/engagement"
              title="Your voice"
              description="Track feedback, complaints and improvement items with an accessible review pathway."
              icon={<MessageSquare size={22} aria-hidden="true" />}
              badge={openEngagementCount ? String(openEngagementCount) + " open" : undefined}
            />
          ) : null}
          {caseManagementConfig.enabled ? (
            <DashboardLinkCard
              href="/dashboard/cases"
              title="Cases (AI-assisted)"
              description="Review case-management activity. AI insights remain advisory and do not replace accountable decisions."
              icon={<ShieldCheck size={22} aria-hidden="true" />}
              badge={openCaseCount ? String(openCaseCount) + " open" : undefined}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
