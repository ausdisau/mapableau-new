import { requirePermission } from "@/lib/auth/guards";
import { RELEASE_RING_ORDER } from "@/lib/releases/rings";
import { requiredApprovalsFor } from "@/lib/releases/approvals";

export default async function ReleaseRingsPage() {
  await requirePermission("platform:releases:read");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Release rings policy</h1>
        <p className="mt-2 max-w-3xl text-sm">
          A release is not GA until it reaches ring_4 AND an executive
          approves. Feature flags do not promote a release.
        </p>
      </header>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Ring</th>
            <th className="p-2 text-left">Required approvals</th>
          </tr>
        </thead>
        <tbody>
          {RELEASE_RING_ORDER.map((ring) => (
            <tr key={ring} className="border-b">
              <td className="p-2 font-mono">{ring}</td>
              <td className="p-2">{requiredApprovalsFor(ring).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
