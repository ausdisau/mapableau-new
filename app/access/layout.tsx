import { MapAbleMarketingFooter } from "@/components/brand/MapAbleMarketingFooter";
import { MapAbleMarketingHeader } from "@/components/brand/MapAbleMarketingHeader";

/** Prisma-backed pages; avoid static prerender at build when DATABASE_URL is unset on Vercel. */
export const dynamic = "force-dynamic";

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <MapAbleMarketingHeader />
      <main className="flex-1">{children}</main>
      <MapAbleMarketingFooter />
    </div>
  );
}
