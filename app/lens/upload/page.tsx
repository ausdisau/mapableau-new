"use client";

import { useState } from "react";

export default function LensUploadPage() {
  const [taskId, setTaskId] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/lens/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storageKey: `uploads/${Date.now()}.jpg` }),
    });
    const data = await res.json();
    await fetch("/api/lens/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: data.upload.id }),
    });
    setTaskId(data.upload.reviewTaskId);
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Upload photo</h1>
      <form onSubmit={upload}>
        <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
          Upload demo image
        </button>
      </form>
      {taskId ? (
        <p>
          <a href={`/lens/review/${taskId}`} className="text-primary underline">
            Review draft observation
          </a>
        </p>
      ) : null}
    </main>
  );
}
