import React from "react";

type ProviderAccessFeaturesProps = {
  accessFeatures: string[];
  supports: string[];
  languages: string[];
};

export function ProviderAccessFeatures({
  accessFeatures,
  supports,
  languages,
}: ProviderAccessFeaturesProps) {
  const modes = supports.filter(Boolean);
  const features = accessFeatures.filter(Boolean);
  const langs = languages.filter(Boolean);

  if (modes.length === 0 && features.length === 0 && langs.length === 0) {
    return (
      <section aria-labelledby="access-heading" className="space-y-2">
        <h2
          id="access-heading"
          className="font-heading text-xl font-semibold text-foreground"
        >
          Access and communication
        </h2>
        <p className="text-sm text-muted-foreground">
          Access capabilities have not been listed yet. Ask the provider about
          wheelchair access, sensory-friendly settings, Auslan, or other needs
          before you book.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="access-heading" className="space-y-4">
      <h2
        id="access-heading"
        className="font-heading text-xl font-semibold text-foreground"
      >
        Access and communication
      </h2>
      {modes.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">How support is delivered</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {modes.map((mode) => (
              <li
                key={mode}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
              >
                {mode}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {features.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Accessibility capabilities
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {langs.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">Languages</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {langs.join(", ")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
