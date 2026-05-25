import { PageContainer } from "@/components/layout/PageContainer";
import { AccessNeedsForm } from "@/components/participant/AccessNeedsForm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getParticipantProfileBundle } from "@/lib/participants/participant-profile-service";

export default async function AccessNeedsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const bundle = await getParticipantProfileBundle(user.id);

  return (
    <PageContainer title="Access needs">
      <p className="text-sm text-slate-600 mb-6">
        Describe what helps you feel safe and comfortable. Use plain language —
        you can update this anytime.
      </p>
      <AccessNeedsForm
        initialNeeds={bundle.accessNeeds.map((n) => ({
          category: n.category,
          plainLanguageNeed: n.plainLanguageNeed,
          importance: n.importance ?? "",
          notes: n.notes ?? "",
        }))}
        summary={bundle.preferences?.accessNeedsSummary ?? ""}
      />
    </PageContainer>
  );
}
