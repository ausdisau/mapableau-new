"use client";

import { LinkButton } from "@/components/ui/link-button";
import { SectionHeader } from "@/components/ui/section-header";
import { InterviewSupportPlanDemo } from "@/components/jobs/InterviewSupportPlanDemo";

export default function EmploymentPageClient() {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC] px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            as="h1"
            eyebrow="MapAble Employment"
            title="Find work with the supports around it."
            description="MapAble Jobs connects inclusive job matching with transport, care, workplace adjustments, NDIS employment supports, and DES/IEA collaboration — with disclosure in your control."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/early-access">Join early access</LinkButton>
            <LinkButton href="/provider-finder?service=employment" variant="outline">
              Explore providers
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-5 py-12">
        <SectionHeader
          as="h2"
          title="For job seekers"
          description="Accessible filters, adjustment preferences, transport planning, and support worker coordination."
        />
        <SectionHeader
          as="h2"
          title="For employers"
          description="Inclusive hiring profiles, adjustment-ready posts, and candidate support visibility by consent."
        />
        <SectionHeader
          as="h2"
          title="Demo: plan support for an interview"
          description="Try a lightweight planning flow. Nothing is saved or shared without your consent."
        />
        <InterviewSupportPlanDemo />
      </section>
    </div>
  );
}
