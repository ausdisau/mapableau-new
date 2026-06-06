import Link from "next/link";

export const metadata = {
  title: "Terms of Service | MapAble",
  description: "Terms for using MapAble care, transport and support services.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">Legal</p>
      <h1 className="mapable-display mt-3 text-4xl font-black tracking-[-0.05em] text-[#0C1833]">
        Terms of Service
      </h1>
      <p className="mt-4 text-base leading-8 text-slate-600">
        By using MapAble you agree to use the platform respectfully, provide accurate information,
        and follow safeguarding and booking rules that keep participants and workers safe.
      </p>
      <section className="mt-8 space-y-4 text-sm leading-7 text-slate-600">
        <h2 className="text-lg font-black text-[#0C1833]">Using MapAble</h2>
        <p>
          MapAble connects participants, carers, providers and transport partners. Service delivery
          remains the responsibility of the provider or partner you choose.
        </p>
        <h2 className="text-lg font-black text-[#0C1833]">Accounts and access</h2>
        <p>
          Keep login details secure. Role-based access applies to dashboards, provider consoles and
          coordinator tools.
        </p>
        <h2 className="text-lg font-black text-[#0C1833]">Support</h2>
        <p>
          For complaints, feedback or engagement matters, use the Support Centre after signing in or
          contact us through the Help Centre.
        </p>
      </section>
      <p className="mt-10 text-sm text-slate-600">
        Read our{" "}
        <Link href="/privacy" className="font-black text-[#005B7F] hover:underline">
          Privacy Policy
        </Link>{" "}
        for data handling details.
      </p>
    </article>
  );
}
