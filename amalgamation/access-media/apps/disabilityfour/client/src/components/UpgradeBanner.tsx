import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("upgradeBannerDismissed");
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("upgradeBannerDismissed", "true");
  };

  if (dismissed) return null;

  return (
    <div 
      className="bg-accent text-accent-foreground border-y border-accent-border"
      role="banner"
      aria-label="Upgrade promotion"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 bg-accent-foreground/10 rounded-full p-2">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm md:text-base">
                Upgrade to Premium for ad-free viewing and exclusive content
              </p>
              <p className="text-xs md:text-sm opacity-90 mt-0.5">
                Support disability-led media with reduced accessibility pricing available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="bg-accent-foreground text-accent hover-elevate font-semibold hidden sm:inline-flex"
              data-testid="button-upgrade-banner"
            >
              Learn More
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-accent-foreground text-accent hover-elevate font-semibold sm:hidden"
              data-testid="button-upgrade-banner-mobile"
            >
              Upgrade
            </Button>
            <button
              onClick={handleDismiss}
              className="text-accent-foreground/70 hover:text-accent-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2"
              aria-label="Dismiss banner"
              data-testid="button-dismiss-banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
