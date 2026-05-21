import { requireAdmin } from "@/lib/auth/guards";
import { phase9Config } from "@/lib/config/phase9";
import { listResearchProjects } from "@/lib/research-safe-room/safe-room-service";

export default async function ResearchSafeRoomPage() {
  await requireAdmin();
  const data = await listResearchProjects();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Research safe room</h1>
      {data.disabled ? (
        <p>RESEARCH_SAFE_ROOM_ENABLED is false — synthetic-only projects blocked.</p>
      ) : (
        <ul className="space-y-2">
          {data.projects.map((p) => (
            <li key={p.id} className="rounded border p-3">
              {p.title} — {p.status} (synthetic: {String(p.syntheticDataOnly)})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
