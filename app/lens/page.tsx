import Link from "next/link";

export default function LensPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">MapAble Lens</h1>
      <p className="text-muted-foreground">
        Upload photos to suggest accessibility observations. AI suggestions are drafts
        until a human reviewer confirms them.
      </p>
      <p className="text-sm">
        Do not photograph people without consent. Avoid private property where
        restricted.
      </p>
      <Link href="/lens/upload" className="text-primary underline">
        Upload a photo
      </Link>
    </main>
  );
}
