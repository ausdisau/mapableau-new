"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileResponse = {
  profile: {
    version: number;
    publishedAt: string | null;
    sections: {
      routinesJson: { label: string; detail: string }[];
      preferencesJson: { label: string; detail: string }[];
      boundariesJson: { label: string; detail: string }[];
      escalationJson: Record<string, string | undefined>;
    };
  };
};

export default function SupportProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    void fetch("/api/support-profile")
      .then(async (res) => {
        if (res.status === 503) {
          setDisabled(true);
          return null;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not load support profile");
        }
        return res.json() as Promise<ProfileResponse>;
      })
      .then((data) => {
        if (data) setProfile(data.profile);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (disabled) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Support profile</h1>
        <p className="text-muted-foreground">
          Support profiles are not enabled in this environment yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Support profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your routines, preferences, boundaries, and escalation instructions —
          shared only with people you consent to.
        </p>
        <Link
          href="/dashboard/support-profile/edit"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Edit support profile →
        </Link>
      </header>

      <section className="max-w-2xl rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6">
        <h2 className="font-semibold">Explainable matching</h2>
        <p className="mt-2 text-muted-foreground">
          When MapAble suggests support workers, your published profile helps explain
          why a match might fit — for example routine compatibility or continuity
          preferences. You always review and confirm matches; nothing is assigned
          automatically.
        </p>
        <Link
          href="/dashboard/care"
          className="mt-3 inline-block font-medium text-primary hover:underline"
        >
          View care requests →
        </Link>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {profile ? (
        <dl className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-4 text-sm">
          <div>
            <dt className="font-medium">Status</dt>
            <dd>
              {profile.publishedAt
                ? `Published (version ${profile.version})`
                : "Draft — publish when ready so matching can use your preferences"}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Routines</dt>
            <dd>{profile.sections.routinesJson.length} item(s)</dd>
          </div>
          <div>
            <dt className="font-medium">Preferences</dt>
            <dd>{profile.sections.preferencesJson.length} item(s)</dd>
          </div>
          <div>
            <dt className="font-medium">Boundaries</dt>
            <dd>{profile.sections.boundariesJson.length} item(s)</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
