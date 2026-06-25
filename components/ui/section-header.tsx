import { cn } from "@/app/lib/utils";

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  className,
  id,
}: SectionHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      {eyebrow ? (
        <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <Heading id={id} className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
        {title}
      </Heading>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
