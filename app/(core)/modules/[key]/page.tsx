import Link from "next/link";
import { notFound } from "next/navigation";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import { getModuleByKey } from "@/lib/platform/modules-catalog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Props) {
  const { key } = await params;
  const mod = getModuleByKey(key);
  if (!mod) return { title: "Module | MapAble" };
  return {
    title: `${mod.name} — coming soon | MapAble`,
    description: mod.description,
  };
}

export default async function ModuleComingSoonPage({ params }: Props) {
  const { key } = await params;
  const mod = getModuleByKey(key);
  if (!mod || mod.availability !== "coming_soon") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <CorePageHeader
        eyebrow="Coming soon"
        title={mod.name}
        description={mod.description}
      />
      <ul className="mt-6 list-inside list-disc text-muted-foreground">
        {mod.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="default" size="default">
          <Link href="/core">Back to MapAble Core</Link>
        </Button>
        <Button variant="outline" size="default" asChild>
          <Link href="/care">Explore MapAble Care</Link>
        </Button>
      </div>
    </div>
  );
}
