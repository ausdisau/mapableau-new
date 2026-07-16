import Link from "next/link";

export default function AuraMissionsDashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">AURA missions</h1>
      <p className="mt-2 text-sm text-slate-700">
        Accessibility missions are started from{" "}
        <Link className="underline" href="/ask?mode=aura">
          Ask MapAble — Accessibility Mission
        </Link>
        . This dashboard shell lists mission history when persistence is enabled.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>
          <Link className="underline" href="/ask?mode=aura">
            Start Accessibility Mission
          </Link>
        </li>
        <li>
          <Link className="underline" href="/access">
            Standard access map (non-AI)
          </Link>
        </li>
        <li>
          <Link className="underline" href="/access-intelligence">
            Access Intelligence
          </Link>
        </li>
      </ul>
    </main>
  );
}
