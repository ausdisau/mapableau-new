import type { Metadata } from "next";
import Link from "next/link";

import { VisionProbeExperiment } from "@/components/labs/VisionProbeExperiment";

export const metadata: Metadata = {
  title: "Vision Probe",
  description:
    "MapAble Labs demonstration: stream an image description via Hugging Face Router. Experimental only.",
};

export default function LabsVisionProbePage() {
  return (
    <div>
      <div className="border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <Link
            href="/labs"
            className="text-sm font-bold text-white/70 underline-offset-4 hover:text-white hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Back to MapAble Labs
          </Link>
        </div>
      </div>
      <VisionProbeExperiment />
    </div>
  );
}
