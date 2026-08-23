import Link from "next/link";

const streams = [
  {
    title: "Mobility Futures Lab",
    description:
      "Experience simulated autonomy, route changes, overrides and decision handoffs without controlling a real mobility device.",
    href: "/labs/mobility-futures",
    status: "Public simulation foundation",
    available: true,
  },
  {
    title: "Vision Probe",
    description:
      "Optional Hugging Face Router demo: stream a short description of an image. Not used for Mobility Futures decisions.",
    href: "/labs/vision-probe",
    status: "HF vision demonstration",
    available: true,
  },
  {
    title: "Access Intelligence Lab",
    description:
      "Explore how accessibility evidence, uncertainty and route information could be presented and compared.",
    href: "/labs/access-intelligence",
    status: "Concept stream",
    available: false,
  },
  {
    title: "Personal Agency Lab",
    description:
      "Test when digital assistants should explain, recommend, ask permission or stay out of the way.",
    href: "/labs/personal-agency",
    status: "Concept stream",
    available: false,
  },
];

export default function LabsHomePage() {
  return (
    <>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(248,197,28,0.16),_transparent_38%),linear-gradient(145deg,#071727,#0B2C3E)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#F8C51C]">
              Explore · Try · Decide · Co-design
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              Explore ideas for the future of accessibility.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75 sm:text-xl">
              MapAble Labs is a public experimentation space for simulations and prototypes. It
              lets people experience emerging ideas, challenge assumptions and help shape what
              MapAble should build next.
            </p>
          </div>
          <aside className="self-end rounded-3xl border border-[#F8C51C]/30 bg-[#F8C51C]/10 p-6">
            <p className="font-black text-[#F8C51C]">Experimental boundary</p>
            <p className="mt-3 leading-7 text-white/80">
              Labs does not control wheelchairs, scooters, exoskeletons, robots or other physical
              assistive technology. Simulated results are not real-world accessibility evidence.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight">Lab streams</h2>
          <p className="mt-3 leading-7 text-white/70">
            The first release establishes a shared Labs framework. New streams should reuse the
            same accessibility, consent, experiment-status and evidence boundaries rather than
            becoming disconnected microsites.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {streams.map((stream) => (
            <article
              key={stream.title}
              className="flex min-h-72 flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/10"
            >
              <span className="w-fit rounded-full border border-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/65">
                {stream.status}
              </span>
              <h3 className="mt-5 text-2xl font-black tracking-tight">{stream.title}</h3>
              <p className="mt-3 flex-1 leading-7 text-white/70">{stream.description}</p>
              {stream.available ? (
                <Link
                  href={stream.href}
                  className="mt-6 inline-flex w-fit rounded-xl bg-[#F8C51C] px-5 py-3 font-black text-[#071727] transition hover:bg-[#FFD94F] focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  Enter experiment
                </Link>
              ) : (
                <span className="mt-6 inline-flex w-fit rounded-xl border border-white/15 px-5 py-3 font-black text-white/55">
                  Not yet open
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            ["Explore", "Understand the idea and its boundaries."],
            ["Try", "Experience an interactive prototype or simulation."],
            ["Decide", "Say what you would choose and what you would reject."],
            ["Co-design", "Change the rules and help shape the next version."],
          ].map(([title, body], index) => (
            <div key={title} className="rounded-2xl border border-white/10 p-5">
              <p className="text-xs font-black text-[#F8C51C]">0{index + 1}</p>
              <h2 className="mt-3 text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
