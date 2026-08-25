import Link from "next/link";
import { redirect } from "next/navigation";

import { MyAccessForm } from "@/components/access/MyAccessForm";
import {
  accessInfrastructureFlags,
  getOrCreateAccessPassport,
} from "@/lib/access/infrastructure";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "My Access | MapAble",
  description:
    "Manage your functional access needs. You control sharing — this is not a medical assessment.",
};

export default async function MyAccessPage() {
  const user = await requireAuth();

  if (!accessInfrastructureFlags.passport) {
    redirect("/dashboard/accessibility");
  }

  const passport = await getOrCreateAccessPassport(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Access as Infrastructure
        </p>
        <h1 className="font-heading text-3xl font-bold">My Access</h1>
        <p className="max-w-2xl text-muted-foreground">
          Describe the access you need in functional terms. MapAble uses this to
          explain places and services — it never reduces you to a score, and you
          remain the decision owner.
        </p>
        <p className="text-sm">
          Presentation preferences (fonts, contrast) stay in{" "}
          <Link
            href="/dashboard/accessibility"
            className="text-primary underline"
          >
            Accessibility preferences
          </Link>
          .
        </p>
      </header>

      <MyAccessForm
        visibilityDefault={passport.visibilityDefault}
        initialRequirements={passport.requirements.map((r) => ({
          id: r.id,
          ontologyConceptId: r.ontologyConceptId,
          domain: r.domain,
          attribute: r.attribute,
          comparator: r.comparator,
          value: r.value,
          unit: r.unit,
          criticality: r.criticality,
          contextScope: r.contextScope,
          timing: r.timing,
          assistance: r.assistance,
          disclosureScopes: r.disclosureScopes,
          userConfirmed: r.userConfirmed,
          notes: r.notes,
        }))}
      />
    </div>
  );
}
