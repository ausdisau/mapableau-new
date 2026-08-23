import Link from "next/link";

import { MobilityFuturesExperiment } from "@/components/labs/MobilityFuturesExperiment";

export const metadata = {
  title: "Mobility Futures Lab",
};

export default function MobilityFuturesLabPage() {
  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/labs"
          className="inline-flex rounded-lg text-sm font-bold text-[#F8C51C] underline decoration-[#F8C51C]/30 underline-offset-4 hover:decoration-[#F8C51C] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/30"
        >
          Back to MapAble Labs
        </Link>
      </div>
      <MobilityFuturesExperiment />
    </div>
  );
}
