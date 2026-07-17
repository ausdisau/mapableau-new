import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { SubscribeForm } from "@/components/accountability/SubscribeForm";

export default function AccountabilitySubscribePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Subscribe to updates</h1>
        <p className="text-muted-foreground">
          Choose consent-based updates about reports, corrections, datasets,
          commitments, governance decisions and AI register changes.
        </p>
      </header>
      <ExplainThisPage summary="Subscriptions are optional and easy to revoke. Signed-in users may also receive in-app notifications when that channel is enabled." />
      <SubscribeForm />
    </div>
  );
}
