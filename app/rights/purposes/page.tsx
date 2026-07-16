import { requireAuth } from "@/lib/auth/guards";
import { listPurposes } from "@/lib/rights-os/purpose-registry";

export default async function PurposesPage() {
  await requireAuth();
  const purposes = listPurposes();

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Registered purposes</h2>
      <p className="text-sm text-muted-foreground">
        Vague purposes such as &quot;improve services&quot; or &quot;personalisation&quot; are not
        permitted without a specific registered purpose.
      </p>
      <ul className="divide-y rounded-lg border">
        {purposes.map((purpose) => (
          <li key={purpose.code} className="p-4">
            <p className="font-medium">{purpose.code}</p>
            <p className="text-sm text-muted-foreground">{purpose.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Allowed fields: {purpose.allowedFields.join(", ") || "none"}
            </p>
            <p className="text-xs text-muted-foreground">
              Prohibited: {purpose.prohibitedFields.join(", ") || "none"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
