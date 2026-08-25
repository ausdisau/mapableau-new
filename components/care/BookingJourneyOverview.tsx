import { ClipboardCheck, Search, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Tell us what works",
    description:
      "Choose the support, timing and communication preferences that matter to you.",
    icon: Search,
  },
  {
    title: "Compare and confirm",
    description:
      "Review any proposed provider and price before a booking is confirmed.",
    icon: ShieldCheck,
  },
  {
    title: "Review every record",
    description:
      "Approve the support record or raise a concern in plain language.",
    icon: ClipboardCheck,
  },
] as const;

export function BookingJourneyOverview() {
  return (
    <section aria-labelledby="booking-journey-title" className="space-y-4">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#005B7F]">
          Your booking journey
        </p>
        <h2
          id="booking-journey-title"
          className="font-heading text-2xl font-bold text-[#0C1833]"
        >
          You stay in control at every step
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          MapAble can organise information and show options. A person reviews
          consequential decisions, and nothing is booked or assigned until the
          required confirmation is complete.
        </p>
      </div>

      <ol className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title}>
              <Card className="h-full border-border/70 shadow-none">
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E7F6F2] text-[#006A4E]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-[#0C1833]">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
