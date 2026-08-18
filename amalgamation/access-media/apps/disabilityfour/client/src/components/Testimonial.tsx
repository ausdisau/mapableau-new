import { useState, useEffect } from "react";
import { Quote } from "lucide-react";

interface TestimonialData {
  quote: string;
  name: string;
  title: string;
  organization: string;
}

const testimonials: TestimonialData[] = [
  {
    quote: "DisabilityFour+ is reshaping how disability stories are told. Their commitment to authentic representation sets a new standard for streaming media.",
    name: "Dr. Sarah Mitchell",
    title: "Professor of Disability Studies",
    organization: "University of Melbourne",
  },
  {
    quote: "As a cooperative member, I'm proud to be part of a platform that centers disabled voices and creates meaningful opportunities for our community.",
    name: "Marcus Chen",
    title: "Documentary Producer",
    organization: "DisabilityFour+ Cooperative",
  },
  {
    quote: "The accessibility features are industry-leading. This platform demonstrates what inclusive design should look like across all streaming services.",
    name: "Jennifer Rodriguez",
    title: "Accessibility Consultant",
    organization: "Access Media Advisory",
  },
];

export function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const current = testimonials[currentIndex];

  return (
    <section 
      className="py-16 md:py-24 bg-warm-beige dark:bg-warm-beige"
      aria-label="Testimonials"
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="relative">
          <Quote 
            className="absolute -top-4 -left-2 w-12 h-12 text-accent opacity-20" 
            aria-hidden="true"
          />
          
          <blockquote className="relative">
            <p className="text-xl md:text-2xl leading-relaxed text-warm-beige-foreground dark:text-warm-beige-foreground font-normal mb-8">
              "{current.quote}"
            </p>
            
            <footer className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {current.name.charAt(0)}
                  </span>
                </div>
              </div>
              
              <div>
                <cite className="not-italic">
                  <div className="font-semibold text-warm-beige-foreground dark:text-warm-beige-foreground">
                    {current.name}
                  </div>
                  <div className="text-sm text-warm-beige-foreground/70 dark:text-warm-beige-foreground/70">
                    {current.title}, {current.organization}
                  </div>
                </cite>
              </div>
            </footer>
          </blockquote>

          <div 
            className="flex gap-2 mt-8 justify-center"
            role="tablist"
            aria-label="Testimonial navigation"
          >
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="w-2 h-2 rounded-full transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{
                  backgroundColor: index === currentIndex ? 'hsl(var(--accent))' : 'hsl(var(--accent) / 0.3)',
                }}
                aria-label={`View testimonial ${index + 1}`}
                aria-selected={index === currentIndex}
                role="tab"
                data-testid={`testimonial-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
