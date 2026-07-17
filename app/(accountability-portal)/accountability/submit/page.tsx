import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";
import { PublicChallengeForm } from "@/components/accountability/PublicChallengeForm";

export default function AccountabilitySubmitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Challenge a publication</h1>
        <p className="text-muted-foreground">
          Anyone can challenge an incorrect statistic, outdated accessibility
          information, misleading methodology, missing context, inaccessible
          publication, incorrect governance information, an AI systems statement,
          or a public commitment update.
        </p>
      </header>
      <ExplainThisPage summary="You will receive a public tracking reference. Your identity is not published. Challenges are reviewed by accountability staff." />
      <PublicChallengeForm />
    </div>
  );
}
