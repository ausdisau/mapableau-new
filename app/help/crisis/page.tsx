import {
  NATIONAL_CRISIS_REFERRALS,
  STATE_MENTAL_HEALTH_TRIAGE,
} from "@/lib/ask-mapable/crisis-referrals";

export const metadata = {
  title: "Crisis support | MapAble",
  description:
    "Verified Australian crisis, suicide prevention, mental health and accessible communication pathways.",
};

function ReferralCard({
  referral,
}: {
  referral: (typeof NATIONAL_CRISIS_REFERRALS)[number];
}) {
  return (
    <article
      id={referral.id}
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{referral.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {referral.audience} · {referral.availability}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {referral.urgency.replace("_", " ")}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6">{referral.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {referral.phone ? (
          <a
            href={`tel:${referral.phone.replace(/\s/g, "")}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Call {referral.phone}
          </a>
        ) : null}
        {referral.text ? (
          <span className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm">
            Text {referral.text}
          </span>
        ) : null}
        <a
          href={referral.href}
          target={referral.href.startsWith("http") ? "_blank" : undefined}
          rel={referral.href.startsWith("http") ? "noreferrer" : undefined}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {referral.href.startsWith("http") ? "Official service" : "Open"}
        </a>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Channels: {referral.channels.join(", ")}.
      </p>
    </article>
  );
}

export default function CrisisSupportPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Australian crisis support
        </p>
        <h1 className="font-heading text-3xl font-bold">Help when things feel unsafe</h1>
        <p className="max-w-3xl text-muted-foreground">
          MapAble can help you find and open a support pathway, but it is not an
          emergency service and does not replace a qualified mental health
          assessment. You choose which service or communication method to use.
        </p>
      </header>

      <section className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-5">
        <h2 className="text-xl font-bold">Immediate danger</h2>
        <p className="mt-2 leading-6">
          If you may act on suicidal thoughts now, have already seriously hurt
          yourself, or anyone is in immediate danger, call <strong>000</strong>
          or go to the nearest emergency department. If speech or hearing makes
          an ordinary phone call difficult, use the National Relay Service
          emergency pathway below.
        </p>
        <a
          href="tel:000"
          className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-destructive px-5 py-3 font-bold text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Call 000
        </a>
      </section>

      <section aria-labelledby="national-crisis-heading" className="space-y-4">
        <div>
          <h2 id="national-crisis-heading" className="text-2xl font-bold">
            National support
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Phone, text, online, culturally specific and accessible options.
          </p>
        </div>
        <div className="grid gap-4">
          {NATIONAL_CRISIS_REFERRALS.map((referral) => (
            <ReferralCard key={referral.id} referral={referral} />
          ))}
        </div>
      </section>

      <section
        id="accessible-contact"
        aria-labelledby="accessible-contact-heading"
        className="scroll-mt-24 rounded-xl border border-border bg-muted/30 p-5"
      >
        <h2 id="accessible-contact-heading" className="text-2xl font-bold">
          Accessible communication
        </h2>
        <p className="mt-3 leading-6">
          A person should not lose access to crisis support because speech,
          hearing, AAC, fatigue, motor access or communication speed makes a
          standard phone call difficult. MapAble should preserve the person's
          usual communication method and allow extra response time.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          The National Relay Service provides emergency relay pathways. SMS
          Relay uses 0423 677 767 and requires the emergency service needed,
          location and brief details. For non-emergency services, use the
          communication channels each service supports.
        </p>
      </section>

      <section id="state-triage" aria-labelledby="state-triage-heading" className="space-y-4 scroll-mt-24">
        <div>
          <h2 id="state-triage-heading" className="text-2xl font-bold">
            State and territory crisis and mental health pathways
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These services provide crisis counselling, clinical triage, mental
            health assessment or referral depending on the jurisdiction and
            service. Most listed pathways operate 24/7.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {STATE_MENTAL_HEALTH_TRIAGE.map((referral) => (
            <ReferralCard key={referral.id} referral={referral} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-bold">What MapAble will and will not do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          <li>It can show verified pathways and help you choose a communication channel.</li>
          <li>It can help prepare a short message describing what you want a service to know.</li>
          <li>It will not claim an external service accepted a referral unless that service confirms it.</li>
          <li>It will not silently send your conversation, disability information, location or contacts to another service.</li>
          <li>It will not use a suicide-risk score as a substitute for human clinical assessment.</li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Crisis contact information is maintained from official Australian service
        sources and should be re-verified regularly. If a listed pathway appears
        unavailable, use 000 for immediate danger or another national crisis
        service above.
      </p>
    </main>
  );
}
