import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { ContentCard } from "./ContentCard";
import type { Content } from "@shared/schema";
import { useRef, useEffect } from "react";

interface ContentRowProps {
  title: string;
  content: Content[];
  viewAllLink?: string;
}

export function ContentRow({ title, content, viewAllLink }: ContentRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const cardWidth = 256 + 24; // lg:w-64 (256px) + gap (24px)
      
      if (e.key === "ArrowRight") {
        e.preventDefault();
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        container.scrollBy({ left: -cardWidth, behavior: "smooth" });
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (content.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <h2 
          id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="font-display font-semibold text-2xl md:text-3xl"
          data-testid={`text-section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {title}
        </h2>
        {viewAllLink && (
          <Link href={viewAllLink} data-testid={`link-view-all-${title.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors hover-elevate rounded-md px-2 py-1 focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2">
            View All
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Horizontal scrolling grid */}
      <div className="relative -mx-4 md:mx-0">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide focus:outline-none focus-visible:outline-none"
          tabIndex={0}
          role="region"
          aria-label={`${title} content carousel`}
        >
          <div className="flex gap-4 md:gap-6">
            {content.map((item) => (
              <div key={item.id} className="flex-none w-48 md:w-56 lg:w-64">
                <ContentCard content={item} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
