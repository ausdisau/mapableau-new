import Link from "next/link";

export const metadata = { title: "MapAble Independence" };

export default function IndependencePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Independence</h1>
      <p className="text-muted-foreground">
        Set goals and routines at your own pace. You control what you share with supporters.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/independence/goals" className="min-h-12 rounded-lg border px-4 py-3 text-center">
          My goals
        </Link>
        <Link href="/independence/routines" className="min-h-12 rounded-lg border px-4 py-3 text-center">
          Daily routines
        </Link>
      </div>
    </main>
  );
}
