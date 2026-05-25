import { CoreFooter } from "@/components/core/CoreFooter";
import { CoreHeader } from "@/components/core/CoreHeader";
import { SkipToContent } from "@/components/core/SkipToContent";

export function CoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipToContent />
      <CoreHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <CoreFooter />
    </div>
  );
}
