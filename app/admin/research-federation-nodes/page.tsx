import { requireAdmin } from "@/lib/auth/guards";
import { listFederationNodes } from "@/lib/research-federation-at-scale/federation-node-service";

export default async function ResearchFederationNodesPage() {
  await requireAdmin();
  const data = await listFederationNodes();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Research federation nodes</h1>
      {data.disabled ? <p>RESEARCH_FEDERATION_AT_SCALE_ENABLED is false.</p> : null}
      <ul className="space-y-2">
        {data.nodes.map((n) => (
          <li key={n.id} className="rounded border p-3 text-sm">
            {n.nodeName} — {n.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
