import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { EmploymentPathways } from "@/components/jobs/EmploymentPathways";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { supportAreaLandingRoutes } from "@/lib/marketing/mapable-care-routes";

export const metadata = {
  title: "MapAble Employment | Inclusive work pathways",
  description:
    "Explore a sample role, find employment support, or sign in to browse and prepare pilot job listings.",
  alternates: canonicalAlternate("/employment"),
};

export default function EmploymentPage() {
  return (
    <>
      <PublicModulePage
        eyebrow="MapAble Employment"
        title="Inclusive employment pathways where disclosure stays in your control."
        description="See the tasks a role involves, explore ways to show your skills, and find employment support. You choose what to share when you apply."
        whoFor={[
          "Disabled job seekers exploring inclusive opportunities.",
          "Employers who want to publish accessible, adjustment-aware roles.",
          "Support coordinators and employment partners tracking goals.",
        ]}
        availableNow={[
          "A sample role brief with examples of skills, work samples and interview formats.",
          "Signed-in jobs routes for invited pilot users.",
          "Provider finder entry points for employment-related support.",
        ]}
        comingSoon={[
          "Job seeker profiles with controlled disclosure settings.",
          "Accessible job posts and application tracking.",
          "Reasonable adjustment request workflow and employment goals.",
        ]}
        safetyNote="Job seekers will control whether disability, access needs or adjustment information is shared. MapAble will not support automated rejection based on access needs."
        primaryCta={{
          label: "Find employment support providers",
          href: supportAreaLandingRoutes.Jobs,
        }}
        secondaryCta={{ label: "Ask about the pilot", href: "/contact" }}
      >
        <EmploymentPathways />
      </PublicModulePage>
      <ModuleCanvasSection module="employment" />
    </>
  );
}
