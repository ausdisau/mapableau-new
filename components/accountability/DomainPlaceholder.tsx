import Link from "next/link";

import { ExplainThisPage } from "@/components/accountability/ExplainThisPage";

export function DomainPlaceholder({
  title,
  description,
  explain,
}: {
  title: string;
  description: string;
  explain: string;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm">
          <Link
            href="/accountability"
            className="text-primary underline-offset-2 hover:underline"
          >
            Accountability
          </Link>
          <span className="text-muted-foreground"> / {title}</span>
        </p>
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      </header>
      <ExplainThisPage summary={explain} />
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold">Publication status</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Domain metrics for this section will appear here once an approved
          publication snapshot includes them. This page never queries raw
          operational Care, Transport, Jobs, incident or complaint records.
        </p>
        <p className="mt-3 text-sm">
          See{" "}
          <Link
            href="/accountability/methodology"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            methodology
          </Link>{" "}
          and{" "}
          <Link
            href="/accountability"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            headline indicators
          </Link>{" "}
          for currently published evidence.
        </p>
      </section>
    </div>
  );
}
