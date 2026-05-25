"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PeerCirclePostComposer({ circleId }: { circleId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const res = await fetch(`/api/peer/circles/${circleId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      setError("Could not post. It may be held for moderation.");
      return;
    }
    window.location.reload();
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm" role="alert">
          {error}
        </div>
      ) : null}
      <label htmlFor="post-body" className="text-sm font-medium">
        Share in this circle
      </label>
      <textarea
        id="post-body"
        required
        rows={4}
        className="min-h-24 w-full rounded-md border px-3 py-2"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" variant="default" size="default" className="min-h-11">
        Post
      </Button>
    </form>
  );
}
