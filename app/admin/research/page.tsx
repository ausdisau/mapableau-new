import Link from "next/link";

import { ResearchGovernanceNotice } from "@/components/analytics/ResearchGovernanceNotice";
import { requireAdmin } from "@/lib/auth/guards";
import { listCoDesignProgrammes, listResearchProjects } from "@/lib/research";

export const metadata = {
  title: "Co-design & research governance | MapAble Admin",
};

export default async function AdminResearchGovernancePage() {
  await requireAdmin();

  const [{ disabled: programmesDisabled, programmes }, { disabled: projectsDisabled, projects }] =
    await Promise.all([listCoDesignProgrammes(50), listResearchProjects(20)]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Co-design & research governance</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Disability-led co-design programmes, granular research consent, payment records, and
          decision audit trails. Research participation is never required for core navigation.
        </p>
      </header>

      <ResearchGovernanceNotice />

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/research" className="underline">
          Research projects hub
        </Link>
        <Link href="/research/participation" className="underline">
          Participant participation view
        </Link>
        <Link href="/docs/co-design-protocol.md" className="underline">
          Co-design protocol
        </Link>
      </nav>

      <section aria-labelledby="programmes-heading" className="space-y-3">
        <h2 id="programmes-heading" className="font-heading text-lg font-semibold">
          Co-design programmes
        </h2>
        {programmesDisabled ? (
          <p className="text-sm text-muted-foreground">Research governance disabled.</p>
        ) : programmes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No co-design programmes yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {programmes.map((programme) => (
              <li key={programme.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">{programme.title}</span>
                  <span className="text-muted-foreground">{programme.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {programme._count.participants} participants ·{" "}
                  {programme._count.consentRecords} consent records ·{" "}
                  {programme._count.decisions} decisions
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="projects-heading" className="space-y-3">
        <h2 id="projects-heading" className="font-heading text-lg font-semibold">
          Linked research projects
        </h2>
        {projectsDisabled ? (
          <p className="text-sm text-muted-foreground">Research governance disabled.</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No research projects yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {projects.map((project) => (
              <li key={project.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">{project.title}</span>
                  <span className="text-muted-foreground">{project.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
