import Link from "next/link";

export default function AdminPeerPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">MapAble Peer admin</h1>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li>
          <Link href="/admin/peer/moderation" className="underline">
            Moderation queue
          </Link>
        </li>
        <li>
          <Link href="/admin/peer/reports" className="underline">
            Reports
          </Link>
        </li>
        <li>
          <Link href="/admin/peer/circles" className="underline">
            Circles
          </Link>
        </li>
        <li>
          <Link href="/admin/peer/mentors" className="underline">
            Mentors
          </Link>
        </li>
        <li>
          <Link href="/admin/peer/events" className="underline">
            Events
          </Link>
        </li>
        <li>
          <Link href="/admin/peer/safety" className="underline">
            Safety
          </Link>
        </li>
      </ul>
    </div>
  );
}
