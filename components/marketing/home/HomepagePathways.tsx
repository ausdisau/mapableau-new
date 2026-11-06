import Link from "next/link";

import { homepagePathways } from "@/lib/marketing/mapable-care-combined-data";

export function HomepagePathways() {
  return (
    <section
      aria-labelledby="pathways-heading"
      className="bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <h2
          id="pathways-heading"
          className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          Three ways to take part
        </h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {homepagePathways.map((pathway) => (
            <li key={pathway.href} className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5">
              <h3 className="text-xl font-black text-[#0C1833]">{pathway.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{pathway.body}</p>
              <Link
                href={pathway.href}
                className="mt-4 inline-flex min-h-11 items-center font-black text-[#005B7F] underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {pathway.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
