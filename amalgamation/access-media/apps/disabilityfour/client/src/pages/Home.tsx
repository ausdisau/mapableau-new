import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ContentRow } from "@/components/ContentRow";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { AccessibilityFeatures } from "@/components/AccessibilityFeatures";
import { CommunityUpdates } from "@/components/CommunityUpdates";
import { Testimonial } from "@/components/Testimonial";
import { MembershipCTA } from "@/components/MembershipCTA";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import type { Content } from "@shared/schema";

export default function Home() {
  const { data: featuredContent, isLoading: isFeaturedLoading } = useQuery<Content[]>({
    queryKey: ["/api/featured"],
  });

  const { data: trendingContent, isLoading: isTrendingLoading } = useQuery<Content[]>({
    queryKey: ["/api/content/trending"],
  });

  const { data: documentaries, isLoading: isDocLoading } = useQuery<Content[]>({
    queryKey: ["/api/content", { category: "Documentary" }],
  });

  const { data: dramas, isLoading: isDramaLoading } = useQuery<Content[]>({
    queryKey: ["/api/content", { category: "Drama" }],
  });

  const { data: sports, isLoading: isSportsLoading } = useQuery<Content[]>({
    queryKey: ["/api/content", { category: "Sports" }],
  });

  const { data: news, isLoading: isNewsLoading } = useQuery<Content[]>({
    queryKey: ["/api/content", { category: "News" }],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Carousel */}
        {isFeaturedLoading ? (
          <div className="w-full aspect-[21/9] md:aspect-[21/7] bg-muted animate-pulse" />
        ) : featuredContent && featuredContent.length > 0 ? (
          <HeroCarousel content={featuredContent} />
        ) : null}

        {/* Accessibility Features Callout */}
        <AccessibilityFeatures />

        {/* Upgrade Banner */}
        <UpgradeBanner />

        {/* Content Sections */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12 space-y-12 md:space-y-16">
          {/* Trending Now */}
          {isTrendingLoading ? (
            <ContentRowSkeleton title="Trending Now" />
          ) : trendingContent && trendingContent.length > 0 ? (
            <ContentRow 
              title="Trending Now" 
              content={trendingContent} 
              viewAllLink="/browse?sort=trending"
            />
          ) : null}
        </div>

        {/* Community Updates */}
        <CommunityUpdates />

        {/* Content Sections Continued */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12 space-y-12 md:space-y-16">
          {/* Documentary */}
          {isDocLoading ? (
            <ContentRowSkeleton title="Documentary" />
          ) : documentaries && documentaries.length > 0 ? (
            <ContentRow 
              title="Documentary" 
              content={documentaries} 
              viewAllLink="/browse?category=Documentary"
            />
          ) : null}
        </div>

        {/* Testimonial */}
        <Testimonial />

        {/* Content Sections Continued */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12 space-y-12 md:space-y-16">
          {/* Drama Series */}
          {isDramaLoading ? (
            <ContentRowSkeleton title="Drama Series" />
          ) : dramas && dramas.length > 0 ? (
            <ContentRow 
              title="Drama Series" 
              content={dramas} 
              viewAllLink="/browse?category=Drama"
            />
          ) : null}

          {/* Sports */}
          {isSportsLoading ? (
            <ContentRowSkeleton title="Sports" />
          ) : sports && sports.length > 0 ? (
            <ContentRow 
              title="Sports" 
              content={sports} 
              viewAllLink="/browse?category=Sports"
            />
          ) : null}
        </div>

        {/* Membership CTA */}
        <MembershipCTA />

        {/* Content Sections Final */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12 space-y-12 md:space-y-16">
          {/* News & Current Affairs */}
          {isNewsLoading ? (
            <ContentRowSkeleton title="News & Current Affairs" />
          ) : news && news.length > 0 ? (
            <ContentRow 
              title="News & Current Affairs" 
              content={news} 
              viewAllLink="/browse?category=News"
            />
          ) : null}
        </div>
      </main>

      {/* Enhanced Footer */}
      <Footer />
    </div>
  );
}

function ContentRowSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4 md:gap-6 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-none w-48 md:w-56 lg:w-64 space-y-2">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
