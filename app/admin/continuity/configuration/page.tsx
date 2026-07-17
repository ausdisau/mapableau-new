import { ContinuityStubPage } from "@/components/continuity/ContinuityStubPage";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  return (
    <ContinuityStubPage
      title="Configuration"
      intro="Civic feed registrations, standing instruction defaults, and other continuity switches. Civic feeds default to disabled."
    />
  );
}
