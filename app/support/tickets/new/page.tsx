import { PageContainer } from "@/components/layout/PageContainer";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";

export default function NewSupportTicketPage() {
  return (
    <PageContainer title="New support ticket">
      <p className="text-sm text-slate-600 mb-6">
        Describe your issue in plain language. Safety concerns are prioritised
        and may be escalated for human review.
      </p>
      <SupportTicketForm />
    </PageContainer>
  );
}
