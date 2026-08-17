import { Captions, AudioLines, Keyboard } from "lucide-react";

export function AccessibilityFeatures() {
  const features = [
    {
      icon: Captions,
      title: "100% Captioned",
      description: "All content includes professional captions for full accessibility",
    },
    {
      icon: AudioLines,
      title: "Audio Described",
      description: "Enhanced accessibility for vision impairment with audio descriptions",
    },
    {
      icon: Keyboard,
      title: "Keyboard Navigable",
      description: "Complete keyboard accessibility throughout the platform",
    },
  ];

  return (
    <section 
      className="py-12 md:py-16 bg-white dark:bg-background border-y border-border"
      aria-label="Accessibility features"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-4"
              data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div 
                className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center"
                aria-hidden="true"
              >
                <feature.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-sans font-semibold text-lg text-foreground">
                {feature.title}
              </h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-xs">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
