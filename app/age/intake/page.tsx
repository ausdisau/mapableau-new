"use client";

export default function AgeIntakePage() {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/age/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeSupportNeeds: String(form.get("needs")),
      }),
    });
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-4 text-lg">
      <h1 className="font-heading text-3xl font-bold">Aged care intake</h1>
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="needs" className="block font-medium">
          What support do you need at home?
        </label>
        <textarea
          id="needs"
          name="needs"
          rows={4}
          className="w-full rounded border p-3 text-lg"
        />
        <button type="submit" className="min-h-14 w-full rounded-lg bg-primary text-xl text-primary-foreground">
          Save intake
        </button>
      </form>
    </main>
  );
}
