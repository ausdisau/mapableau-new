import Link from "next/link";

import { PeerBoundaryNotice } from "@/components/peer";

export default function PeerMentorHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer mentor portal</h1>
      <PeerBoundaryNotice />
      <ul className="list-disc pl-6">
        <li>
          <Link href="/peer-mentor/profile">Manage mentor profile</Link>
        </li>
        <li>
          <Link href="/peer-mentor/requests">Review connection requests</Link>
        </li>
        <li>
          <Link href="/peer-mentor/sessions">Sessions (placeholder)</Link>
        </li>
      </ul>
    </div>
  );
}
