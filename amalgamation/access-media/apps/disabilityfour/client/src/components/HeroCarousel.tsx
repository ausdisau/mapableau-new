import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";

interface HeroCarouselProps {
  content: Content[];
}

export function HeroCarousel({ content }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % content.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + content.length) % content.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Keyboard navigation - scoped to carousel container
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      previous();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      next();
      e.preventDefault();
    }
  };

  if (content.length === 0) return null;

  const currentContent = content[currentIndex];

  return (
    <section 
      className="relative w-full aspect-[21/9] md:aspect-[21/7] bg-muted overflow-hidden focus-within:outline-none" 
      aria-label="Featured content carousel"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img
          src={currentContent.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          role="presentation"
        />
        {/* Deeper navy gradient overlay for enhanced text contrast */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-deeper-navy/75 to-deeper-navy/30" 
          data-testid="hero-overlay"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="relative h-full mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col justify-end h-full pb-12 md:pb-16 max-w-2xl">
          <div className="space-y-4">
            <p 
              className="font-sans font-medium text-lg md:text-xl text-white/90 tracking-wide"
              data-testid="text-hero-tagline"
            >
              Authentic Stories. Powerful Voices.
            </p>
            <h1 
              className="font-display font-bold text-3xl md:text-5xl lg:text-6xl text-white leading-tight tracking-wide"
              data-testid="text-hero-title"
              style={{ letterSpacing: '0.02em' }}
            >
              {currentContent.title}
            </h1>
            <p className="text-base md:text-lg text-white/90 line-clamp-2 md:line-clamp-3">
              {currentContent.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={`/watch/${currentContent.id}`} data-testid="button-hero-play" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
                <Button 
                  size="lg"
                  className="bg-accent text-accent-foreground hover-elevate border-accent-border font-semibold gap-2 focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                  Watch Now
                </Button>
              </Link>
              <Link href={`/watch/${currentContent.id}`} data-testid="button-hero-info" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
                <Button 
                  size="lg"
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover-elevate gap-2 focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Info className="h-5 w-5" aria-hidden="true" />
                  More Info
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={previous}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-2 md:p-3 transition-all focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label="Previous featured content"
        data-testid="button-carousel-prev"
      >
        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
      </button>

      <button
        onClick={next}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-2 md:p-3 transition-all focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label="Next featured content"
        data-testid="button-carousel-next"
      >
        <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
      </button>

      {/* Carousel Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Carousel navigation">
        {content.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1 rounded-full transition-all focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
              index === currentIndex 
                ? "w-8 bg-accent" 
                : "w-6 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={index === currentIndex}
            role="tab"
            data-testid={`button-carousel-indicator-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
