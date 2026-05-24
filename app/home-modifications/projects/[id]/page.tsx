import { AccessDeniedPanel } from "@/components/shared/MapAbleModuleUi";
import { FundingNotesPanel } from "@/components/home-modifications/FundingNotesPanel";
import { HomeAccessIssueIntake } from "@/components/home-modifications/HomeAccessIssueIntake";
import { HomeModificationInvoiceStatus } from "@/components/home-modifications/HomeModificationInvoiceStatus";
import { ModificationPhotoUpload } from "@/components/home-modifications/ModificationPhotoUpload";
import { OtAssessmentBookingHook } from "@/components/home-modifications/OtAssessmentBookingHook";
import { ProjectMilestoneTracker } from "@/components/home-modifications/ProjectMilestoneTracker";
import { QuoteComparisonTable } from "@/components/home-modifications/QuoteComparisonTable";
import { QuoteRequestPanel } from "@/components/home-modifications/QuoteRequestPanel";
import { requireAuth } from "@/lib/auth/guards";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getHomeModificationRequest } from "@/lib/home-modifications/home-modification-service";
import { compareQuotes } from "@/lib/home-modifications/quote-service";
import { getProject } from "@/lib/home-modifications/project-milestone-service";

export default async function HomeModificationProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const project = await getProject({ projectId: id });
  if (project) {
    const quotes = await compareQuotes(project.requestId);
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <h1 className="font-heading text-2xl font-bold">{project.title}</h1>
        <ProjectMilestoneTracker milestones={project.milestones} />
        <QuoteComparisonTable quotes={quotes} />
        <FundingNotesPanel notes={project.fundingNotes} />
        <HomeModificationInvoiceStatus
          invoiceId={project.invoiceId}
          status={project.status}
        />
      </div>
    );
  }

  try {
    const request = await getHomeModificationRequest({
      requestId: id,
      actorUserId: user.id,
      actorRole: user.primaryRole,
    });

    const assessment = request.assessments[0];
    const quotes = await compareQuotes(request.id);

    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
        <HomeAccessIssueIntake issues={request.accessIssues} />
        <ModificationPhotoUpload requestId={request.id} />
        <OtAssessmentBookingHook
          requestId={request.id}
          scheduledAt={assessment?.scheduledAt}
        />
        <QuoteRequestPanel quotes={request.quotes} />
        <QuoteComparisonTable quotes={quotes} />
        <FundingNotesPanel notes={request.fundingNotes} />
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <AccessDeniedPanel message={accessDeniedMessage("not_found")} />
      </div>
    );
  }
}
