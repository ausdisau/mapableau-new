"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type WorkerRow = {
  id: string;
  displayName: string;
  active: boolean;
  directoryPublication: { published: boolean; consentedAt: string | null } | null;
};

export default function WorkerDirectorySettingsPage() {
  const { status } = useSession();
  const [profiles, setProfiles] = useState<WorkerRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function refresh() {
    const response = await fetch("/api/workers/directory-publication", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load your worker profiles");
    const data = (await response.json()) as { profiles: WorkerRow[] };
    setProfiles(data.profiles);
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/workers/directory-publication", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your worker profiles");
        return response.json();
      })
      .then((result: { profiles: WorkerRow[] }) => { if (active) setProfiles(result.profiles); })
      .catch(() => { if (active) setNotice("Worker directory settings are unavailable."); });
    return () => { active = false; };
  }, [status]);

  async function update(workerProfileId: string, published: boolean) {
    setBusyId(workerProfileId);
    setNotice("");
    try {
      const response = await fetch("/api/workers/directory-publication", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerProfileId, published }),
      });
      if (!response.ok) throw new Error("Could not change publication consent");
      await refresh();
      setNotice(published ? "Your selected profile is published for signed-in directory searches." : "Your profile has been withdrawn from discovery.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusyId(null);
    }
  }

  return <main className="container mx-auto max-w-2xl space-y-6 px-4 py-10">
    <Link href="/worker/profile" className="underline">Back to worker profile</Link>
    <h1 className="text-3xl font-bold">Worker directory visibility</h1>
    <p>Only you can publish your own worker profile here. Publication makes your display name, self-declared service types, regions, languages and summary discoverable to signed-in MapAble users. Credential or screening status is not displayed or verified by this setting.</p>
    {status === "loading" && <p role="status">Checking sign-in…</p>}
    {status === "unauthenticated" && <p><Link className="underline" href="/login">Sign in</Link> to manage your listings.</p>}
    {status === "authenticated" && profiles.length === 0 && <p>No worker profiles are linked to this account.</p>}
    {status === "authenticated" && profiles.map((profile) => (
      <section key={profile.id} className="space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">{profile.displayName}</h2>
        <p>Currently: {profile.directoryPublication?.published ? "Published" : "Private"}</p>
        <button
          type="button"
          disabled={busyId === profile.id || (!profile.active && !profile.directoryPublication?.published)}
          onClick={() => { void update(profile.id, !profile.directoryPublication?.published); }}
          className="rounded-md border px-4 py-3 font-semibold disabled:opacity-50"
        >
          {profile.directoryPublication?.published ? "Withdraw this profile" : "Publish this profile"}
        </button>
      </section>
    ))}
    <p role="status" aria-live="polite">{notice}</p>
    <p className="text-sm text-muted-foreground">Withdrawal is effective for future searches; it cannot retract information someone already saw. MapAble does not certify your screening or competence by publishing a listing.</p>
  </main>;
}
