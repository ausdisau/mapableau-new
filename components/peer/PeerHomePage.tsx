import Link from "next/link";

import { CommunityGuidelinesPanel } from "./CommunityGuidelinesPanel";
import { PeerBoundaryNotice } from "./PeerBoundaryNotice";

const LINKS = [
  { href: "/peer/circles", label: "Peer circles" },
  { href: "/peer/questions", label: "Lived-experience Q&A" },
  { href: "/peer/stories", label: "Stories and resources" },
  { href: "/peer/mentors", label: "Peer mentors" },
  { href: "/peer/events", label: "Events" },
  { href: "/peer/profile", label: "Your peer profile" },
  { href: "/peer/settings/privacy", label: "Privacy settings" },
];

export function PeerHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">MapAble Peer</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Safe peer connection and lived-experience support — not social media.
          No followers, no public like counts, no outrage feed.
        </p>
      </header>
      <PeerBoundaryNotice />
      <nav aria-label="Peer areas">
        <ul className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex min-h-12 items-center rounded-lg border px-4 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <CommunityGuidelinesPanel />
      <CommunityGuidelinesPanel easyRead />
    </div>
  );
}
