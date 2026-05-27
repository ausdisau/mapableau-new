import { PortalNav, type PortalNavLink } from "@/components/core/PortalNav";
import { SkipToContent } from "@/components/core/SkipToContent";
import { MODULE_MAIN_CLASS } from "@/lib/platform/constants";

export async function PortalShell({
  title,
  links,
  backHref = "/dashboard",
  backLabel = "Dashboard",
  logoHref = "/core",
  guard,
  children,
  mainClassName = MODULE_MAIN_CLASS,
}: {
  title: string;
  links: PortalNavLink[];
  backHref?: string;
  backLabel?: string;
  logoHref?: string;
  /** Run auth/permission checks before rendering (e.g. requirePermission). */
  guard?: () => Promise<unknown>;
  children: React.ReactNode;
  mainClassName?: string;
}) {
  if (guard) {
    await guard();
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <PortalNav
        title={title}
        links={links}
        backHref={backHref}
        backLabel={backLabel}
        logoHref={logoHref}
      />
      <main id="main-content" className={mainClassName}>
        {children}
      </main>
    </div>
  );
}
