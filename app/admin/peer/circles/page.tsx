import { listPeerCircles } from "@/lib/peer/peer-circle-service";

export default async function AdminPeerCirclesPage() {
  const circles = await listPeerCircles();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer circles</h1>
      <p className="text-sm text-muted-foreground">
        Create circles via POST /api/admin/peer/circles
      </p>
      <ul>
        {circles.map((c) => (
          <li key={c.id}>
            {c.title} ({c.topic})
          </li>
        ))}
      </ul>
    </div>
  );
}
