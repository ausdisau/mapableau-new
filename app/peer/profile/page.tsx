"use client";

import { useEffect, useState } from "react";

import { PeerDisplayNameSelector } from "@/components/peer";
import { Button } from "@/components/ui/button";

export default function PeerProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [displayNameMode, setDisplayNameMode] = useState("community_alias");
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/peer/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setHasProfile(true);
          setDisplayName(d.profile.displayName);
          setDisplayNameMode(d.profile.displayNameMode);
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    const method = hasProfile ? "PATCH" : "POST";
    await fetch("/api/peer/profile", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, displayNameMode }),
    });
    window.location.reload();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-heading text-2xl font-bold">Your peer profile</h1>
      <p className="text-sm text-muted-foreground">
        Separate from your participant support profile. Diagnosis is never required.
      </p>
      <label htmlFor="display-name" className="text-sm font-medium">
        Display name
      </label>
      <input
        id="display-name"
        className="min-h-11 w-full rounded-md border px-3"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <PeerDisplayNameSelector
        value={displayNameMode}
        onChange={setDisplayNameMode}
      />
      <Button type="button" variant="default" size="default" className="min-h-11" onClick={() => void save()}>
        Save profile
      </Button>
    </div>
  );
}
