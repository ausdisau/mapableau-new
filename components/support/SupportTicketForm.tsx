"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { value: "profile_help", label: "Login or account" },
  { value: "booking_help", label: "Booking issue" },
  { value: "transport_issue", label: "Transport issue" },
  { value: "billing_question", label: "Billing or invoice" },
  { value: "care_provider_issue", label: "Provider verification" },
  { value: "accessibility_issue", label: "Accessibility issue" },
  { value: "technical_issue", label: "Technical bug" },
  { value: "complaint", label: "Complaint" },
  { value: "safeguarding_concern", label: "Incident or safety" },
  { value: "other", label: "Other" },
];

export function SupportTicketForm({
  bookingId,
}: {
  bookingId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("booking_help");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setStatus("Submitting…");
        const res = await fetch("/api/support/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            bookingId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("");
          setError(data.error ?? "Could not create ticket");
          return;
        }
        router.push(`/support/tickets/${data.ticket.id}`);
      }}
    >
      {error ? (
        <div role="alert" className="text-red-800 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          required
          className="w-full min-h-11 border rounded-md px-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <select
          id="category"
          className="w-full min-h-11 border rounded-md px-3"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="desc" className="block text-sm font-medium mb-1">
          What happened?
        </label>
        <textarea
          id="desc"
          required
          rows={5}
          className="w-full border rounded-md px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="min-h-11 px-4 rounded-md bg-blue-700 text-white font-medium"
      >
        Submit ticket
      </button>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </form>
  );
}
