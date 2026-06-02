import { CareNav } from "@/components/care/CareNav";
import { requirePermission } from "@/lib/auth/guards";
import { mapablePageContainerClass } from "@/lib/brand/styles";
import { cn } from "@/app/lib/utils";

export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:read:self");

  return (
    <div className="min-h-screen bg-background">
      <CareNav />
      <main
        id="main-content"
        className={cn(mapablePageContainerClass, "mx-auto max-w-6xl py-8")}
      >
        {children}
      </main>
    </div>
  );
}
