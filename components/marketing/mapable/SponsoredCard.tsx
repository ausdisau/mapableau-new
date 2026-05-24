import { cn } from "@/app/lib/utils";

import { SponsoredBadge } from "./SponsoredBadge";

export function SponsoredCard({
  title,
  description,
  label = "Sponsored partner",
  href,
  className,
}: {
  title: string;
  description: string;
  label?: "Sponsored partner" | "Sponsored result" | "Community partner" | "Featured provider";
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      <SponsoredBadge label={label} />
      <h3 className="mapable-display mt-3 text-lg font-semibold text-mapable-navy">
        {title}
      </h3>
      <p className="mapable-soft mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </>
  );

  const boxClass = cn(
    "rounded-2xl border-2 border-dashed border-mapable-yellow/50 bg-mapable-yellow/5 p-5",
    className,
  );

  if (href) {
    return (
      <a href={href} className={cn(boxClass, "mapable-focus-ring block hover:bg-mapable-yellow/10")}>
        {inner}
      </a>
    );
  }

  return <article className={boxClass}>{inner}</article>;
}
