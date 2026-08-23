import Link from "next/link";

const autonomyModes = [
  {
    name: "Inform",
    description: "The simulated system explains what it sees. You make every navigation decision.",
  },
  {
    name: "Suggest",
    description: "The simulated system recommends options and waits for your choice.",
  },
  {
    name: "Assist",
    description: "Routine simulated navigation can continue, but meaningful changes require your approval.",
  },
  {
    name: "Compare",
    description: "Experience the same scenario under different autonomy rules and compare how they feel.",
  },
];

export const metadata = {
  title: "Mobility Futures Lab",
};

export default function MobilityFuturesLabPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/labs"
        className="inline-flex rounded-lg text-sm font-bold text-[#F8C51C] underline decoration-[#F8C51C]/30 underline-offset-4 hover:decoration-[#F8C51C] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/30"
      >
        Back to MapAble Labs
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F8C51C]">
            Simulation foundation
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Mobility Futures Lab
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
            Explore how simulated autonomous mobility might communicate, recommend, reroute and
            return control. This foundation does not connect to or control a real mobility device.
          </p>
        </section>

        <aside className="rounded-3xl border border-[#F8C51C]/25 bg-[#F8C51C]/10 p-6">
          <p className="font-black text-[#F8C51C]">Simulation only</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75">
            <li>No motor, steering or braking control.</li>
            <li>No clinical or safety certification claim.</li>
            <li>No simulated observation becomes live GAIS evidence.</li>
            <li>You can leave the experience at any time.</li>
          </ul>
        </aside>
      </div>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.045] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">Choose how autonomy should behave</h2>
            <p className="mt-2 max-w-2xl leading-7 text-white/65">
              The first interactive scenario will compare different authority models. The controls
              below document the intended study design; scenario execution will be added as a
              separate, tested slice.
            </p>
          </div>
          <span className="w-fit rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/60">
            Interactive runtime: not yet enabled
          </span>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {autonomyModes.map((mode) => (
            <article key={mode.name} className="rounded-2xl border border-white/10 p-5">
              <h3 className="text-xl font-black">{mode.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{mode.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <article className="rounded-3xl border border-white/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F8C51C]">Planned scenario</p>
          <h2 className="mt-3 text-xl font-black">Routine journey</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Compare a straightforward journey under different levels of simulated automation.
          </p>
        </article>
        <article className="rounded-3xl border border-white/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F8C51C]">Planned scenario</p>
          <h2 className="mt-3 text-xl font-black">Unexpected barrier</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Decide whether the system should stop, suggest, reroute or hand control back.
          </p>
        </article>
        <article className="rounded-3xl border border-white/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F8C51C]">Planned scenario</p>
          <h2 className="mt-3 text-xl font-black">Lift unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Test how much authority a simulated mobility system should have when the planned route fails.
          </p>
        </article>
      </section>
    </div>
  );
}
