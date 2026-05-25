import Link from "next/link";

import { MAPABLE_WIX_SITE_URL } from "@/lib/integrations/wix/config";

export const metadata = {
  title: "Provider Finder | MapAble",
  description:
    "Embeddable provider search for MapAble — use on mapabl.au and partner sites.",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-background px-4 py-2 text-center text-xs text-muted-foreground">
        <span>MapAble Provider Finder — </span>
        <Link
          href={MAPABLE_WIX_SITE_URL}
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          mapabl.au
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
