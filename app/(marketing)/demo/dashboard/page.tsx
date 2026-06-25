import Link from "next/link";

import { SectionHeader } from "@/components/ui/section-header";

const panels = [
  { title: "My profile", body: "Access needs, mobility aids, communication preferences.", href: "/dashboard/profile" },
  { title: "My services", body: "Map contributions, care requests, transport trips, job applications.", href: "/dashboard" },
  { title: "My schedule", body: "Unified calendar placeholder for signed-in users.", href: "/dashboard/calendar" },
  { title: "My messages", body: "Unified inbox placeholder.", href: "/messages" },
  { title: "My billing and documents", body: "Invoices and funding source placeholders.", href: "/dashboard/billing" },
  { title: "Help and support", body: "Support tickets and accessibility contact.", href: "/help" },
];

export const metadata = {
  title: "MapAble Core demo | Dashboard preview",
  description: "Preview the MapAble Core dashboard shell. Sign in for the full experience.",
};

export default function DemoDashboardPage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-5 py-12">
      <SectionHeader
        as="h1"
        eyebrow="Demo"
        title="MapAble Core dashboard preview"
        description="This is a static preview. The full authenticated dashboard lives at /dashboard."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {panels.map((panel) => (
          <Link
            key={panel.title}
            href={panel.href}
            className="rounded-2xl border border-border p-5 hover:bg-muted/40 focus:outline-none focus:ring-4 focus:ring-[hsl(var(--accent)/0.4)]"
          >
            <h2 className="font-bold">{panel.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{panel.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
