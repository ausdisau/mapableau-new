import { InterestForm } from "@/components/marketing/InterestForm";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata = {
  title: "Early access | MapAble",
  description: "Join the MapAble early access list for participants and carers.",
};

export default function EarlyAccessPage() {
  return (
    <main id="main-content" className="mx-auto max-w-xl px-5 py-12">
      <SectionHeader
        as="h1"
        eyebrow="Early access"
        title="Join the early access list"
        description="Help shape Australia's accessibility layer for care, transport, jobs, and everyday places."
      />
      <div className="mt-8">
        <InterestForm
          formType="early_access"
          intro="We will only use your details to contact you about MapAble early access."
        />
      </div>
    </main>
  );
}
