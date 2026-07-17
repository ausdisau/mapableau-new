import Link from "next/link";

export default function AuraWorldPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Journey world</h1>
      <p>Structured segment list — graph information also available as ordered list.</p>
      <WorldSegments missionIdPromise={params} />
      <Link href="../guardian" className="text-blue-700 underline">
        Journey Guardian
      </Link>
    </main>
  );
}

async function WorldSegments({
  missionIdPromise,
}: {
  missionIdPromise: Promise<{ missionId: string }>;
}) {
  const { missionId } = await missionIdPromise;
  return (
    <ol className="list-decimal pl-5" aria-label="Journey segments">
      <li>Origin → accessible transport</li>
      <li>Central Station pathway</li>
      <li>Destination stop → curb zone</li>
      <li>Entrance B → western lift → Room 3.12</li>
    </ol>
  );
}
