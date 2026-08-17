import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MembershipCTA() {
  const benefits = [
    "Vote on content decisions and cooperative direction",
    "Access exclusive member-only content and events",
    "Support disability-led content creation",
    "Join a community of advocates and creators",
  ];

  return (
    <section 
      className="py-16 md:py-24 bg-warm-beige dark:bg-warm-beige"
      aria-labelledby="membership-heading"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 space-y-6">
            <h2 
              id="membership-heading"
              className="text-3xl md:text-4xl font-display font-bold text-warm-beige-foreground dark:text-warm-beige-foreground tracking-wide"
            >
              Become a Member of DisabilityFour+
            </h2>
            
            <p className="text-lg text-warm-beige-foreground/80 dark:text-warm-beige-foreground/80 leading-relaxed max-w-2xl">
              Join Australia's first disability-led streaming cooperative. As a member, you're not just a subscriber—you're an owner with a voice in shaping our platform's future.
            </p>

            <ul className="space-y-3" aria-label="Membership benefits">
              {benefits.map((benefit, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3"
                  data-testid={`benefit-${index}`}
                >
                  <Check 
                    className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" 
                    aria-hidden="true"
                  />
                  <span className="text-warm-beige-foreground dark:text-warm-beige-foreground">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 lg:items-center">
            <div className="bg-white dark:bg-background rounded-md p-6 border border-border space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Membership starts at</p>
                <p className="text-4xl font-bold text-foreground">
                  $12<span className="text-lg font-normal text-muted-foreground">/month</span>
                </p>
              </div>
              
              <Button 
                size="lg"
                variant="default"
                className="w-full bg-accent hover:bg-accent text-accent-foreground font-semibold focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2"
                data-testid="button-join-cooperative"
              >
                Join Today
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime • Member benefits included
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
