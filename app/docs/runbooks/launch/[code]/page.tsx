import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { PUBLIC_LAUNCH_CHECKLIST_CODES } from "@/lib/launch-readiness/public-launch-checklist";

export default async function LaunchRunbookPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireAdmin();
  const { code } = await params;
  if (!PUBLIC_LAUNCH_CHECKLIST_CODES.includes(code)) {
    notFound();
  }

  const filePath = path.join(
    process.cwd(),
    "docs",
    "runbooks",
    "launch",
    `${code}.md`
  );
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-8">
      <p>
        <Link
          href="/admin/launch-readiness"
          className="text-sm text-primary underline-offset-2 hover:underline"
        >
          ← Launch checklist
        </Link>
      </p>
      <article className="whitespace-pre-wrap rounded-lg border bg-card p-6 font-mono text-sm leading-relaxed">
        {content}
      </article>
    </div>
  );
}
