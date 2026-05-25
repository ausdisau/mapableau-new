import Link from "next/link";

import { HomeSearch } from "@/components/home/HomeSearch";

export default function Page() {
  return (
    <>
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-4 py-3 text-center text-sm">
        <span className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/ask"
            className="font-semibold text-primary transition hover:text-primary/80 focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ask MapAble (Co-Pilot + PRMS) →
          </Link>
          <Link
            href="/core"
            className="font-semibold text-secondary transition hover:text-secondary/80 focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open MapAble Core platform →
          </Link>
        </span>
      </div>
      <HomeSearch />
    </>
  );
}
