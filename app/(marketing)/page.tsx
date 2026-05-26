import Link from "next/link";

import { HomeSearch } from "@/components/home/HomeSearch";
import { MapAbleCareCombinedSections } from "@/components/marketing/MapAbleCareCombinedSections";

export default function Page() {
  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-3 text-center text-sm">
        <span className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/ask"
            className="rounded-lg font-black text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            Ask MapAble for guided support
          </Link>
          <Link
            href="/core"
            className="rounded-lg font-black text-secondary transition hover:text-secondary/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            Open MapAble Core platform
          </Link>
        </span>
      </div>
      <HomeSearch />
      <MapAbleCareCombinedSections />
    </>
  );
}
