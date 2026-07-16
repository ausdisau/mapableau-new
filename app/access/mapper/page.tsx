import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community mapper field kit | MapAble Access",
  description: "Offline-capable community observation capture with privacy safeguards.",
};

export default function MapperFieldKitPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Community mapper field kit</h1>
      <p className="mt-3">
        Capture structured observations with calibration, image privacy consent, and
        pathway-gated evidence types. Contribution points never change confidence.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        <li>No facial, disability, emotion, or cognitive-capacity recognition</li>
        <li>Temporary image retention by default</li>
        <li>Observed vs estimated classification required</li>
      </ul>
      <p className="mt-4">
        Flag: <code>ACCESS_INTELLIGENCE_MAPPER_FIELD_KIT</code>
      </p>
    </main>
  );
}
