import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { ContentRow } from "@/components/ContentRow";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Share2 } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import type { Content } from "@shared/schema";

export default function Watch() {
  const [, params] = useRoute("/watch/:id");
  const contentId = params?.id;

  const { data: content, isLoading } = useQuery<Content>({
    queryKey: ["/api/content", contentId],
    enabled: !!contentId,
  });

  const { data: relatedContent } = useQuery<Content[]>({
    queryKey: ["/api/content", { category: content?.category }],
    enabled: !!content?.category,
  });

  const related = relatedContent?.filter((item) => item.id !== contentId).slice(0, 6) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Video Player Section */}
        <div className="bg-black">
          <div className="mx-auto max-w-7xl">
            <div className="aspect-video bg-black flex items-center justify-center relative">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : content ? (
                <>
                  {content.source === "youtube" && content.youtubeVideoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${content.youtubeVideoId}?autoplay=0&rel=0`}
                      title={`${content.title} – YouTube playback`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      data-testid="youtube-player-iframe"
                    />
                  ) : (
                    <VideoPlayer
                      videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      title={content.title}
                      poster={content.thumbnail}
                      transcriptDiv="video-transcript"
                      captions={[
                        {
                          src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.vtt",
                          srclang: "en",
                          label: "English",
                          kind: "captions"
                        }
                      ]}
                    />
                  )}
                </>
              ) : (
                <p className="text-white">Content not found</p>
              )}
            </div>
          </div>
        </div>

        {/* YouTube Attribution Section */}
        {content && content.source === "youtube" && content.channelName && (
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 border-b">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SiYoutube className="h-4 w-4 text-red-600" aria-hidden="true" />
                <span>From <strong className="text-foreground">{content.channelName}</strong> on YouTube</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="button-watch-on-youtube"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${content.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <SiYoutube className="h-4 w-4" />
                  Watch on YouTube
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Transcript (for Able Player) */}
        {content && content.source !== "youtube" && (
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 border-b">
            <div id="video-transcript" className="text-sm" data-testid="video-transcript-container">
              {/* Able Player will populate this div with interactive transcript */}
            </div>
          </div>
        )}

        {/* Content Details */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : content ? (
            <div className="space-y-6">
              {/* Title and metadata */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display font-bold text-3xl md:text-4xl mb-3" data-testid="text-video-title">
                      {content.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {content.year && <span data-testid="text-video-year">{content.year}</span>}
                      {content.duration && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span>{content.duration} min</span>
                        </>
                      )}
                      {content.episodeCount && content.contentType === "series" && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span>{content.episodeCount} episodes</span>
                        </>
                      )}
                      <span aria-hidden="true">•</span>
                      <Badge 
                        variant={content.tier === "PREMIUM" ? "default" : "secondary"}
                        className={content.tier === "PREMIUM" ? "bg-accent text-accent-foreground border-accent-border" : ""}
                        data-testid="badge-video-tier"
                      >
                        {content.tier === "FREE" ? "FREE with Ads" : "Premium"}
                      </Badge>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="gap-2" data-testid="button-add-list">
                      <Plus className="h-4 w-4" />
                      My List
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-2" data-testid="button-share">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="max-w-3xl">
                  <p className="text-base leading-relaxed" data-testid="text-video-description">
                    {content.description}
                  </p>
                </div>

                {/* Category */}
                <div>
                  <span className="text-sm text-muted-foreground">Category: </span>
                  <Badge variant="secondary" data-testid="badge-video-category">
                    {content.category}
                  </Badge>
                </div>
              </div>

              {/* Related Content */}
              {related.length > 0 && (
                <div className="mt-12 pt-12 border-t">
                  <ContentRow 
                    title={`More ${content.category}`} 
                    content={related}
                    viewAllLink={`/browse?category=${content.category}`}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Content not found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
