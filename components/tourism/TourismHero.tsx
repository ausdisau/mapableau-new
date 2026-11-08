import Image from "next/image";
import Link from "next/link";

export function TourismHero() {
  return (
    <section className="relative overflow-hidden bg-[#073451] text-white">
      <Image
        src="/tourism/opera.svg"
        alt=""
        fill
        unoptimized
        className="object-cover opacity-25"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-black uppercase tracking-widest text-[#a7eee0]">
          Your city. Your pace. Your choice.
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.1] tracking-tight md:text-7xl">
          Go places.
          <br />
          <span className="text-[#F8C51C]">Know the access.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
          Discover Sydney, plan a trip that fits your needs and see what is documented — and what still needs checking.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="min-h-11 rounded-xl bg-[#F8C51C] px-6 py-4 font-black text-[#0C1833] focus-visible:outline-4 focus-visible:outline-offset-4"
            href="/tourism/plan"
          >
            Start planning <span aria-hidden>→</span>
          </Link>
          <Link
            className="min-h-11 rounded-xl border border-white/70 px-6 py-4 font-bold text-white focus-visible:outline-4"
            href="/tourism/trips/sydney-demo"
          >
            Explore Sydney in 3 days
          </Link>
        </div>
      </div>
    </section>
  );
}
