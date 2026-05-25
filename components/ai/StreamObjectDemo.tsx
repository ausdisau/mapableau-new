"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";

import { cocktailsListSchema } from "@/lib/ai/stream-object-schema";

export function StreamObjectDemo() {
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/stream-object",
    schema: cocktailsListSchema,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            submit("Summer garden party with friends, prefer refreshing and low-alcohol drinks.")
          }
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isLoading ? "Generating…" : "Generate cocktails"}
        </button>
        {isLoading ? (
          <button
            type="button"
            onClick={() => stop()}
            className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Stop
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Something went wrong. Check that AI Gateway is configured.
        </p>
      ) : null}

      <div
        className="space-y-4"
        aria-live="polite"
        aria-busy={isLoading}
        aria-label="Generated cocktails"
      >
        {object?.cocktails?.map((cocktail, index) => (
          <article
            key={index}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h2 className="font-heading text-lg font-semibold">
              {cocktail?.name ?? "…"}
            </h2>
            {cocktail?.ingredients?.length ? (
              <div className="mt-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Ingredients
                </h3>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {cocktail.ingredients.map((item, i) => (
                    <li key={i}>{item ?? "…"}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {cocktail?.instructions ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {cocktail.instructions}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {!isLoading && !object?.cocktails?.length && !error ? (
        <p className="text-sm text-muted-foreground">
          Press generate to stream a typed cocktail list as the model writes it.
        </p>
      ) : null}
    </div>
  );
}
