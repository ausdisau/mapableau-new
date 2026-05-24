import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { getCyberReadinessChecklist } from "@/lib/security/cyber-readiness-service";

export const metadata = { title: "Cyber readiness | Admin" };

export default async function CyberReadinessPage() {
  await requireAdmin();
  const checklist = await getCyberReadinessChecklist();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Cyber readiness</h1>
      <ul className="space-y-3">
        {checklist.map((item) => (
          <li key={item.id} className="rounded-lg border p-4">
            <div className="font-medium">{item.label}</div>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
            {item.href ? (
              <Link href={item.href} className="mt-2 inline-block text-sm text-primary underline">
                Open
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
