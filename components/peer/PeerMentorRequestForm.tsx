"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PeerMentorRequestForm({ mentorId }: { mentorId: string }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    const res = await fetch(`/api/peer/mentors/${mentorId}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Request sent. You will get a privacy-safe notification when there is an update.
      </p>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor={`mentor-msg-${mentorId}`} className="text-sm font-medium">
        Message (optional)
      </label>
      <textarea
        id={`mentor-msg-${mentorId}`}
        rows={3}
        className="w-full rounded-md border px-3 py-2"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" variant="default" size="default" className="min-h-11">
        Request connection
      </Button>
    </form>
  );
}
