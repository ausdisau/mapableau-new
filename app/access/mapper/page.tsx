import type { Metadata } from "next";

import { MapperFieldKitClient } from "@/components/access-intelligence/mapper-field-kit-client";

export const metadata: Metadata = {
  title: "Community mapper field kit | MapAble Access",
  description:
    "Offline-capable community observation capture with privacy safeguards.",
};

export default function MapperFieldKitPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Community mapper field kit</h1>
      <p className="mt-3">
        Capture structured observations with calibration, image privacy consent,
        and pathway-gated evidence types.
      </p>
      <div className="mt-6">
        <MapperFieldKitClient />
      </div>
    </main>
  );
}
