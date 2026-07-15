import Link from "next/link";
import { notFound } from "next/navigation";
import React, { type ReactNode } from "react";

import { PrintChecklistButton } from "@/components/resources/PrintChecklistButton";
import { getResourceArticleBySlug } from "@/lib/resources/resource-articles-data";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

const SLUG = "sensory-friendly-canberra-half-day-itinerary";

export const metadata = {
  title: "Sensory-Friendly Canberra Half-Day Itinerary | MapAble",
  description:
    "A calm half-day Canberra itinerary linking the National Museum of Australia and the National Arboretum, with sensory preparation, transport notes and carer tips.",
};

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
          <span
            className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#005B7F]/40 bg-white text-[0.65rem] font-black text-[#005B7F]"
            aria-hidden="true"
          >
            ☐
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  id,
  title,
  children,
  tone = "default",
}: {
  id: string;
  title: string;
  children: ReactNode;
  tone?: "default" | "soft" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : tone === "soft"
        ? mapablePublicMutedCardClass
        : mapablePublicCardClass;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${toneClass} scroll-mt-24`}
    >
      <h2
        id={`${id}-heading`}
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        {children}
      </div>
    </section>
  );
}

function FactCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={mapablePublicCardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-7 text-[#0C1833]">
        {value}
      </p>
    </div>
  );
}

function RouteStopCard({
  step,
  title,
  summary,
  points,
}: {
  step: string;
  title: string;
  summary: string;
  points: string[];
}) {
  return (
    <article className={mapablePublicCardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
        {step}
      </p>
      <h3 className="mt-2 text-base font-black text-[#0C1833]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-700">{summary}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </article>
  );
}

export default function SensoryFriendlyCanberraItineraryPage() {
  const article = getResourceArticleBySlug(SLUG);
  if (!article) {
    notFound();
  }

  return (
    <div className="bg-white text-[#0C1833] print:bg-white">
      {/* 1. Hero */}
      <header className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC] print:border-b print:bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl print:hidden"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>
            {article.eyebrow}
            {article.locationLabel ? ` · ${article.locationLabel}` : ""}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>{article.title}</h1>
          <p className={mapablePublicLeadClass}>{article.description}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Warm, practical planning for a low-rush half day. Go at your pace.
            Change the plan if energy, weather or crowds ask for it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <a
              href="#sensory-checklist"
              className={mapablePublicPrimaryButtonClass}
            >
              Jump to sensory checklist
            </a>
            {article.checklistDownloadHref ? (
              <a
                href={article.checklistDownloadHref}
                download
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Download printable checklist
              </a>
            ) : null}
            <PrintChecklistButton />
            <Link
              href="/resources#featured-resources"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Back to resources
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-6 py-12 sm:py-16`}
      >
        <nav
          aria-label="On this page"
          className={`${mapablePublicMutedCardClass} print:hidden`}
        >
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#005B7F]">
            On this page
          </h2>
          <ol className="mt-4 grid gap-2 text-sm leading-7 text-slate-700 sm:grid-cols-2">
            {[
              ["#who-for", "Who this itinerary is for"],
              ["#quick-facts", "Quick facts"],
              ["#recommended-route", "Recommended route"],
              ["#stop-1-museum", "Stop 1: National Museum of Australia"],
              ["#stop-2-arboretum", "Stop 2: National Arboretum Canberra"],
              ["#sensory-checklist", "Sensory preparation checklist"],
              ["#transport-notes", "Transport notes"],
              ["#alternatives", "Low-transition alternatives"],
              ["#carer-notes", "Support worker / carer notes"],
              ["#verification", "Verification disclaimer"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 2. Who this itinerary is for */}
        <SectionCard id="who-for" title="Who this itinerary is for">
          <p>
            This half-day plan is for people with disability, neurodivergent
            visitors, families, carers and support coordinators who want a
            predictable Canberra outing without rushing.
          </p>
          <p>
            It works well when you need clear steps, quieter choices, accessible
            toilets nearby, and permission to shorten the day without “failing”
            the itinerary.
          </p>
          <Checklist
            items={[
              "You prefer fewer venue transitions in one outing",
              "You want indoor culture plus outdoor calm in the same half day",
              "You are planning with a support worker, family member or friend",
              "You need sensory options (quiet rooms, headphones-friendly spaces, outdoor exit routes)",
            ]}
          />
        </SectionCard>

        {/* 3. Quick facts */}
        <SectionCard id="quick-facts" title="Quick facts">
          <p>
            Keep these facts handy while you book transport and choose a start
            time. Always re-check details on the day.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FactCard label="Pace" value="Half day · about 3–4 hours on site, plus travel buffers" />
            <FactCard label="Stops" value="Two venues max · or one venue if energy is low" />
            <FactCard label="Tone" value="Low-rush · choose shorter loops first" />
            <FactCard
              label="Quiet option"
              value="National Museum quiet hours on the first Tuesday of the month (confirm before travelling)"
            />
            <FactCard
              label="Key access notes"
              value="Museum: lifts, accessible toilets, Changing Places on Lower Ground. Arboretum: Village Centre ramp, accessible parking and toilets"
            />
            <FactCard
              label="Transport flag"
              value="Arboretum has no direct public bus or light rail — book accessible transport before adding it"
            />
          </div>
        </SectionCard>

        {/* 4. Recommended route */}
        <SectionCard id="recommended-route" title="Recommended route">
          <p>
            Start indoors at the museum, keep the gallery loop short, then take
            a calmer outdoor reset at the Arboretum if transport is confirmed.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5">
            <li>
              Arrive at the{" "}
              <a
                href="#stop-1-museum"
                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                National Museum of Australia
              </a>{" "}
              in a quieter window when you can.
            </li>
            <li>
              Visit one short indoor loop, then rest (quiet room, atrium seating
              or outdoor cafe seating).
            </li>
            <li>
              Travel to the{" "}
              <a
                href="#stop-2-arboretum"
                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                National Arboretum Canberra
              </a>{" "}
              only after transport is confirmed.
            </li>
            <li>
              Keep Arboretum time short: views near the Village Centre, a short
              sealed path, then rest or leave.
            </li>
          </ol>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <RouteStopCard
              step="Stop 1"
              title="National Museum of Australia"
              summary="Indoor culture with lifts, toilets, quiet spaces and optional quiet hours."
              points={[
                "Short gallery loop only",
                "Build in a rest before leaving",
                "Use quiet room or outdoor seating if needed",
              ]}
            />
            <RouteStopCard
              step="Stop 2"
              title="National Arboretum Canberra"
              summary="Outdoor calm and wide views — only if transport is sorted in advance."
              points={[
                "Village Centre first",
                "Short sealed path, then sit",
                "Leave early if weather or energy shifts",
              ]}
            />
          </div>
        </SectionCard>

        {/* 5. Stop 1 */}
        <SectionCard
          id="stop-1-museum"
          title="Stop 1: National Museum of Australia"
        >
          <p>
            The museum is a strong first stop because it is compact, has lifts
            between levels, and offers quieter spaces when you need a pause.
          </p>
          <h3 className="text-base font-black text-[#0C1833]">Why it fits</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>Indoor control over light, noise and crowd intensity.</li>
            <li>
              Quiet hours sessions are offered for visitors who prefer reduced
              noise and lighting (first Tuesday of the month — confirm on the
              museum calendar).
            </li>
            <li>
              Accessible toilets on multiple levels, plus a Changing Places
              facility on the Lower Ground floor.
            </li>
            <li>
              A multi-faith / quiet room for reflection, prayer or time out.
            </li>
          </ul>
          <h3 className="mt-4 text-base font-black text-[#0C1833]">
            Suggested half-day approach
          </h3>
          <Checklist
            items={[
              "Park in accessible bays near the main entrance if you have a permit, or plan drop-off",
              "Choose one gallery theme instead of covering every level",
              "Use headphones in louder spaces; step outside or into the quiet room if needed",
              "Rest in the Gandel Atrium or outdoor cafe seating before the next transition",
              "Book museum wheelchairs or scooters ahead if you want to borrow one (about 24 hours’ notice is suggested)",
            ]}
          />
          <p className="mt-2 text-slate-600">
            Tip: if the cafe feels busy, take away and sit outside, or skip food
            here and rest instead.
          </p>
        </SectionCard>

        {/* 6. Stop 2 */}
        <SectionCard
          id="stop-2-arboretum"
          title="Stop 2: National Arboretum Canberra"
          tone="soft"
        >
          <p>
            The Arboretum offers space, trees and long views. It can feel
            restorative — as long as travel there is calm and planned.
          </p>
          <div
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
            role="note"
          >
            <p className="font-bold text-amber-950">Transport flag</p>
            <p className="mt-2 text-amber-950">
              The National Arboretum Canberra has{" "}
              <strong>no direct public bus or light rail</strong>. Confirm
              accessible transport (car, taxi, rideshare or booked accessible
              transport) before you add it to your plan.
            </p>
          </div>
          <h3 className="mt-2 text-base font-black text-[#0C1833]">
            Keep the visit short
          </h3>
          <Checklist
            items={[
              "Use Village Centre accessible parking if travelling by car (permit holders often park free — confirm current rules)",
              "Use the sealed ramp (“The Cutting”) from carpark to Village Centre; rest benches are available along the way",
              "Stay near the Village Centre for views, toilets, cafe and a short sealed path",
              "Avoid long hillside walks unless energy and mobility are strong that day",
              "Watch sun, wind and heat — outdoor paths can be exposed",
            ]}
          />
          <p>
            Free wheelchair hire may be available at the Village Centre —
            ask Visitor Services on arrival.
          </p>
        </SectionCard>

        {/* 7. Sensory preparation checklist */}
        <SectionCard
          id="sensory-checklist"
          title="Sensory preparation checklist"
        >
          <p>
            Pack for your senses first. A calm bag can make transitions easier
            than any perfect timetable.
          </p>
          <Checklist
            items={[
              "Noise support: headphones, earplugs or a preferred quiet soundtrack",
              "Light support: sunglasses, cap or hoodie for glare and bright galleries",
              "Regulation tools: fidgets, weighted lap item, communication cards, preferred snacks",
              "Body support: water, layers, medication you already use, phone charger",
              "Exit plan: who leads a leave, where you wait, and what “done for today” looks like",
              "Timing: buffer between stops; no pressure to finish both venues",
              "Quiet booking: check museum quiet hours or quieter mid-week mornings",
              "Crowd cues: agree a simple signal for “too much” without long explanations",
            ]}
          />
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            {article.checklistDownloadHref ? (
              <a
                href={article.checklistDownloadHref}
                download
                className={mapablePublicPrimaryButtonClass}
              >
                Download printable checklist
              </a>
            ) : null}
            <PrintChecklistButton label="Print full itinerary" />
          </div>
        </SectionCard>

        {/* 8. Transport notes */}
        <SectionCard id="transport-notes" title="Transport notes">
          <p>
            Transport is often the hardest part of a good access day. Treat it
            as part of the itinerary, not an afterthought.
          </p>
          <h3 className="text-base font-black text-[#0C1833]">
            Museum transport
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Accessible parking for permit holders is available near the main
              entrance (route may be weather-exposed).
            </li>
            <li>
              Drop-off close to the entrance can reduce walking fatigue before
              you even start.
            </li>
            <li>
              Allow extra time if you are linking public transport then a short
              transfer.
            </li>
          </ul>
          <h3 className="mt-4 text-base font-black text-[#0C1833]">
            Arboretum transport
          </h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              There is <strong>no direct public transport</strong> to the
              Arboretum — do not assume a bus or light rail connection.
            </li>
            <li>
              Plan car, taxi, rideshare or booked accessible transport before
              you leave the museum.
            </li>
            <li>
              If transport falls through, switch to a low-transition alternative
              below instead of pushing on.
            </li>
          </ul>
          <p>
            MapAble Transport can help with accessible trip planning ideas, but
            always confirm live availability with your chosen provider.
          </p>
          <p>
            <Link
              href="/transport"
              className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Explore MapAble Transport
            </Link>
          </p>
        </SectionCard>

        {/* 9. Low-transition alternatives */}
        <SectionCard id="alternatives" title="Low-transition alternatives">
          <p>
            A successful outing is one that matches today’s capacity. These
            swaps keep the day useful without forcing both stops.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Museum only",
                body: "Stay at the National Museum longer. Add rests, a quiet room visit and one short outdoor sit nearby.",
              },
              {
                title: "Arboretum only",
                body: "Drive or book transport straight to the Village Centre. Short view + toilet + leave.",
              },
              {
                title: "One stop + rest home",
                body: "Do one venue, then return home for a planned recovery window instead of a second transition.",
              },
              {
                title: "Outdoor sit only",
                body: "If galleries feel too much, choose a short lakeside or National Triangle rest with toilets nearby — then stop.",
              },
            ].map((option) => (
              <article key={option.title} className={mapablePublicCardClass}>
                <h3 className="text-base font-black text-[#0C1833]">
                  {option.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {option.body}
                </p>
              </article>
            ))}
          </div>
        </SectionCard>

        {/* 10. Support worker / carer notes */}
        <SectionCard
          id="carer-notes"
          title="Support worker / carer notes"
        >
          <p>
            Your role is steadiness: pace, choices and exits — not packing the
            day with “must-sees”.
          </p>
          <Checklist
            items={[
              "Confirm consent and preferences before the outing (noise, touch, photo, food, exits)",
              "Share the plan as a short sequence: arrive → short look → rest → decide next",
              "Book or confirm Arboretum transport before leaving Stop 1",
              "Carry spare headphones / water / snacks and keep the exit plan visible",
              "Prefer “we can leave now” language over persuasion to stay",
              "Note what worked for next time — without writing personal clinical advice",
              "If coordinating for NDIS participants, treat this as practical planning support only, not plan or funding advice",
            ]}
          />
          <p>
            Support coordinators can share this page and the printable checklist
            with families. Decisions about funding, clinical care or therapies
            sit with the right professionals — not this guide.
          </p>
        </SectionCard>

        {/* 11. Verification disclaimer */}
        <SectionCard
          id="verification"
          title="Verification disclaimer"
          tone="warning"
        >
          <p>
            MapAble publishes this itinerary as plain-language community
            planning support for accessible visiting. It is{" "}
            <strong>
              not medical, therapy, legal or NDIS advice
            </strong>
            .
          </p>
          <p>
            Venue access details change. Paths, toilets, quiet hours, staffing,
            parking rules and transport options can shift without notice.
          </p>
          <p className="font-semibold text-amber-950">
            Check current opening hours, quiet-hour bookings, transport availability and accessibility details before travelling.
          </p>
          <p>
            Especially confirm Arboretum transport before you rely on Stop 2.
            If anything cannot be verified on the day, choose a simpler
            one-stop plan.
          </p>
          <p>
            MapAble does not replace emergency services, legal advice, clinical
            advice, safeguarding authorities, or NDIS funding decisions. If
            someone is in immediate danger, call 000.
          </p>
        </SectionCard>

        <section
          className={`${mapablePublicMutedCardClass} print:hidden`}
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading" className="text-lg font-black text-[#0C1833]">
            Related MapAble resources
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <Link
                href="/guides/act/canberra-accessibility-guide"
                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Canberra Accessibility Guide
              </Link>
            </li>
            <li>
              <Link
                href="/resources#access-guides"
                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Access Guides on the resource hub
              </Link>
            </li>
            <li>
              <Link
                href="/access"
                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                MapAble Access
              </Link>
            </li>
            <li>
              <Link
                href="/transport"
                className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                MapAble Transport
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
