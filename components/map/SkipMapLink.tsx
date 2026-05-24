"use client";

type SkipMapLinkProps = {
  targetId?: string;
  label?: string;
};

export function SkipMapLink({
  targetId = "map-accessible-results",
  label = "Skip map and view list",
}: SkipMapLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow focus:ring-2 focus:ring-ring"
    >
      {label}
    </a>
  );
}
