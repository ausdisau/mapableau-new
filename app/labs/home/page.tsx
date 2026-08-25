import Link from "next/link";

import { HomeExperiment } from "@/components/labs/HomeExperiment";
import { mapableHomeFlags } from "@/lib/config/mapable-home";

export const metadata = {
  title: "MapAble Home Lab",
};

export default function HomeLabPage() {
  if (!mapableHomeFlags.labsEnabled) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">MapAble Home Lab</h1>
        <p className="mt-4 text-white/75">
          This experiment is not open in this environment. The Home Lab flag is
          off by default.
        </p>
        <Link
          href="/labs"
          className="mt-6 inline-flex rounded-lg text-sm font-bold text-[#F8C51C] underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/30"
        >
          Back to MapAble Labs
        </Link>
      </div>
    );
  }

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
      <HomeExperiment />
    </div>
  );
}
