import { Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Update {
  id: number;
  headline: string;
  description: string;
  timestamp: string;
  category: "news" | "event" | "spotlight";
}

const updates: Update[] = [
  {
    id: 1,
    headline: "New Documentary Series: Breaking Barriers",
    description: "Premiering next month, follow five Australian athletes preparing for international competition",
    timestamp: "2 days ago",
    category: "news",
  },
  {
    id: 2,
    headline: "Member Spotlight: Emma Thompson",
    description: "Meet the filmmaker behind our award-winning Access All Areas series",
    timestamp: "5 days ago",
    category: "spotlight",
  },
  {
    id: 3,
    headline: "Upcoming Event: Virtual Town Hall",
    description: "Join us March 15 to discuss cooperative initiatives and upcoming content",
    timestamp: "1 week ago",
    category: "event",
  },
  {
    id: 4,
    headline: "Production Update: Drama Series Greenlit",
    description: "Excited to announce our first scripted drama featuring disabled leads",
    timestamp: "2 weeks ago",
    category: "news",
  },
];

export function CommunityUpdates() {
  return (
    <section 
      className="py-12 md:py-16 bg-soft-gray dark:bg-soft-gray"
      aria-label="Community updates"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-soft-gray-foreground dark:text-soft-gray-foreground">
            Community Updates
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2"
            data-testid="button-view-all-updates"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {updates.map((update) => (
            <article
              key={update.id}
              className="bg-white dark:bg-background rounded-md p-6 border border-border hover-elevate active-elevate-2 transition-all"
              data-testid={`update-${update.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <time dateTime={update.timestamp}>{update.timestamp}</time>
                </div>

                <h3 className="font-semibold text-base text-foreground leading-tight">
                  {update.headline}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {update.description}
                </p>

                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-center gap-1 text-primary hover:text-primary focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2"
                  data-testid={`button-read-more-${update.id}`}
                >
                  Read more <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
