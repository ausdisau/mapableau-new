import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";

export const metadata = { title: "PBS preferences | Dashboard" };
export const dynamic = "force-dynamic";

export default async function PbsProfilePage() {
  if (!pbsConfig.enabled) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="font-heading text-2xl font-bold">PBS preferences</h1>
        <p className="mt-2 text-muted-foreground">Module disabled.</p>
      </div>
    );
  }
  await requireAuth();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">
        Communication and decision-making preferences
      </h1>
      <p className="text-sm text-muted-foreground">
        Supported decision-making does not imply incapacity. Communication style
        is never used to infer capacity.
      </p>
      <p className="text-sm">
        Prefer using the guided questionnaire to record preferences. Easy Read
        mode, pause, skip, and “I don’t know” are available where safe.
      </p>
    </div>
  );
}
