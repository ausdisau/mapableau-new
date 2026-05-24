import Link from "next/link";

export default function FoodsHomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">MapAble Foods</h1>
      <p className="text-muted-foreground">
        Accessible meal ordering with allergy warnings and delivery through MapAble
        Transport.
      </p>
      <Link href="/foods/menu" className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-primary-foreground">
        Browse menu
      </Link>
    </main>
  );
}
