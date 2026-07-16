import Link from "next/link";

type Props = { params: Promise<{ recoveryId: string }> };

export default async function RecoveryRightsPage({ params }: Props) {
  const { recoveryId } = await params;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link href={`/recovery/${recoveryId}`} className="underline">
          Back
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">Rights and complaints</h1>
      <p className="mt-2 text-slate-700">
        ContinuityOS may draft requests and prepare complaints. It does not determine
        legal liability, reverse payments or approve refunds.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li>MapAble Rights Centre</li>
        <li>Provider complaint pathway</li>
        <li>Safety Centre for safeguarding concerns</li>
      </ul>
    </main>
  );
}
