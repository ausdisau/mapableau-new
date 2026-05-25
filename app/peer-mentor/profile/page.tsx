"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function PeerMentorProfilePage() {
  const [bio, setBio] = useState("");
  const [boundaries, setBoundaries] = useState("");

  async function save() {
    await fetch("/api/peer-mentor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: bio || "I offer peer support based on lived experience.",
        livedExperienceTopics: [],
        boundaries,
      }),
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-heading text-2xl font-bold">Mentor profile</h1>
      <label htmlFor="mentor-bio" className="text-sm font-medium">
        Bio
      </label>
      <textarea
        id="mentor-bio"
        rows={6}
        className="w-full rounded-md border px-3 py-2"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <label htmlFor="mentor-boundaries" className="text-sm font-medium">
        Boundaries
      </label>
      <textarea
        id="mentor-boundaries"
        rows={3}
        className="w-full rounded-md border px-3 py-2"
        value={boundaries}
        onChange={(e) => setBoundaries(e.target.value)}
      />
      <Button type="button" variant="default" size="default" className="min-h-11" onClick={() => void save()}>
        Save
      </Button>
    </div>
  );
}
