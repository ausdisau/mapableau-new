import { CareTransportDemo } from "@/components/demo/CareTransportDemo";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata = {
  title: "Care + transport demo | MapAble",
  description: "Demonstration of coordinated care and accessible transport planning.",
};

export default function CareTransportDemoPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
      <SectionHeader
        as="h1"
        eyebrow="Demo"
        title="Care visit with transport"
        description="Plan a support shift and accessible pickup in one coordinated flow."
      />
      <div className="mt-8">
        <CareTransportDemo />
      </div>
    </main>
  );
}
