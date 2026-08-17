import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Play, Tv, Radio, Film } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import type { Content } from "@shared/schema";

interface ContentCardProps {
  content: Content;
}

const contentTypeIcons = {
  series: Tv,
  movie: Film,
  live: Radio,
  news: Radio,
  podcast: Radio,
};

export function ContentCard({ content }: ContentCardProps) {
  const Icon = contentTypeIcons[content.contentType as keyof typeof contentTypeIcons] || Play;

  return (
    <Link href={`/watch/${content.id}`} data-testid={`card-content-${content.id}`} className="group block focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
          {/* Thumbnail */}
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* YouTube Source Badge - top left corner */}
          {content.source === "youtube" && (
            <Badge 
              variant="secondary"
              className="absolute top-2 left-2 z-10 bg-red-600 text-white border-none text-xs px-2 py-1 flex items-center gap-1 hover-elevate"
              data-testid="badge-youtube-source"
            >
              <SiYoutube className="h-3 w-3" aria-hidden="true" />
              <span>YouTube</span>
            </Badge>
          )}

          {/* Tier Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={content.tier === "PREMIUM" ? "default" : "secondary"}
              className={content.tier === "PREMIUM" 
                ? "bg-accent text-accent-foreground border-accent-border font-semibold" 
                : "bg-card/90 backdrop-blur-sm"
              }
              data-testid={`badge-tier-${content.tier.toLowerCase()}`}
            >
              {content.tier === "FREE" ? "FREE with Ads" : "Premium"}
            </Badge>
          </div>

          {/* Content Type Icon */}
          <div className="absolute bottom-2 left-2">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-1.5">
              <Icon className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </div>
          </div>

          {/* Hover Play Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-accent rounded-full p-3">
              <Play className="h-6 w-6 text-accent-foreground fill-current" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="mt-2 space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-title-${content.id}`}>
            {content.title}
          </h3>
          {/* Below title, show channel name for YouTube content */}
          {content.source === "youtube" && content.channelName && (
            <p className="text-xs text-muted-foreground truncate" data-testid="text-channel-name">
              Channel: {content.channelName}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {content.year && <span>{content.year}</span>}
            {content.episodeCount && content.contentType === "series" && (
              <>
                <span aria-hidden="true">•</span>
                <span>{content.episodeCount} episodes</span>
              </>
            )}
            {content.duration && (
              <>
                <span aria-hidden="true">•</span>
                <span>{content.duration} min</span>
              </>
            )}
          </div>
        </div>
    </Link>
  );
}
