import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | MapAble",
  description: "How MapAble collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">Legal</p>
      <h1 className="mapable-display mt-3 text-4xl font-black tracking-[-0.05em] text-[#0C1833]">
        Privacy Policy
      </h1>
      <p className="mt-4 text-base leading-8 text-slate-600">
        MapAble is designed around participant control, consent and transparent data use. This
        summary explains how information is handled across care, transport, engagement and support
        features.
      </p>
      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-600">
        <h2 className="text-lg font-black text-[#0C1833]">What we collect</h2>
        <p>
          Account details, support preferences, bookings, messages, accessibility needs and
          engagement feedback needed to deliver services you request.
        </p>
        <h2 className="text-lg font-black text-[#0C1833]">How we use it</h2>
        <p>
          To match providers, coordinate transport, improve service quality, meet safeguarding
          obligations and respond to your support requests.
        </p>
        <h2 className="text-lg font-black text-[#0C1833]">Your choices</h2>
        <p>
          You can review consent settings in your dashboard and contact us for access or correction
          requests.
        </p>
      </section>
      <p className="mt-10 text-sm text-slate-600">
        Questions? Visit the{" "}
        <Link href="/ask" className="font-black text-[#005B7F] hover:underline">
          Help Centre
        </Link>{" "}
        or email support from the site footer.
      </p>
    </article>
  );
}
