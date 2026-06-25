import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { SectionHeader } from "@/components/ui/section-header";
import { SkipToContent } from "@/components/core/SkipToContent";
import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { DesignSystemToggleDemo } from "@/components/marketing/DesignSystemToggleDemo";

export const metadata = {
  title: "Design system | MapAble",
  description: "Accessible MapAble UI primitives and tokens.",
};

export default function DesignSystemPage() {
  return (
    <>
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-4xl space-y-12 px-5 py-12">
        <SectionHeader
          as="h1"
          eyebrow="MapAble design system"
          title="Accessible components"
          description="Reusable primitives for marketing and product surfaces. WCAG 2.2 AA target."
        />

        <section aria-labelledby="buttons-heading">
          <h2 id="buttons-heading" className="mb-4 text-xl font-bold">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" size="default">Primary</Button>
            <Button variant="secondary" size="default">Secondary</Button>
            <Button variant="outline" size="default">Outline</Button>
            <LinkButton href="/">Link button</LinkButton>
          </div>
        </section>

        <section aria-labelledby="status-heading">
          <h2 id="status-heading" className="mb-4 text-xl font-bold">
            Status alerts
          </h2>
          <div className="space-y-3">
            <Alert variant="success" title="Success">
              Your changes were saved.
            </Alert>
            <Alert variant="warning" title="Warning">
              Review required before booking.
            </Alert>
            <Alert variant="error" title="Error">
              Something went wrong. Try again.
            </Alert>
            <Alert variant="review" title="Review required">
              A team member will check this request.
            </Alert>
          </div>
        </section>

        <section aria-labelledby="card-heading">
          <h2 id="card-heading" className="mb-4 text-xl font-bold">
            Card
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Example card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cards use semantic structure with visible headings.
              </p>
              <Badge variant="default" className="mt-3">Badge</Badge>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="mb-4 text-xl font-bold">
            Form field
          </h2>
          <AccessibleFormField
            id="demo-name"
            label="Your name"
            required
            hint="As you would like to be addressed"
          >
            <input
              id="demo-name"
              type="text"
              className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
            />
          </AccessibleFormField>
        </section>

        <section aria-labelledby="toggle-heading">
          <h2 id="toggle-heading" className="mb-4 text-xl font-bold">
            Toggle group
          </h2>
          <DesignSystemToggleDemo />
        </section>
      </main>
    </>
  );
}
