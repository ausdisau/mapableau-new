"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import {
  CONTACT_TOPICS,
  contactTopicLabels,
  type ContactTopic,
} from "@/lib/contact/contact-form-schema";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type FieldErrors = Partial<
  Record<"name" | "email" | "topic" | "message" | "form", string>
>;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("general");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, company }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setErrors({ form: data.error ?? "Could not send your message." });
        setStatus("idle");
        return;
      }

      setSuccessMessage(data.message ?? "Thanks — your message was received.");
      setStatus("success");
      setName("");
      setEmail("");
      setTopic("general");
      setMessage("");
      setCompany("");
    } catch {
      setErrors({
        form: "Network error. Check your connection and try again.",
      });
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`${mapablePublicCardClass} border-[#005B7F]/15 bg-[#F6FBFC]`}
        role="status"
        aria-live="polite"
      >
        <p className={mapablePublicSectionTitleClass}>Message sent</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{successMessage}</p>
        <button
          type="button"
          className={`${mapablePublicPrimaryButtonClass} mt-6`}
          onClick={() => {
            setStatus("idle");
            setSuccessMessage("");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`${mapablePublicCardClass} border-[#005B7F]/15 bg-white`}
      aria-labelledby="contact-form-heading"
    >
      <p className={mapablePublicSectionTitleClass}>Send a message</p>
      <h2
        id="contact-form-heading"
        className="mapable-display mt-2 text-xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-2xl"
      >
        Tell us how we can help
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Do not include NDIS plan documents, clinical records, or other sensitive
        health information unless MapAble has invited you through a secure
        process.
      </p>

      {errors.form ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.form}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        <AccessibleFormField
          id="contact-name"
          label="Your name"
          required
          error={errors.name}
        >
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="contact-email"
          label="Email address"
          hint="We will reply to this address."
          required
          error={errors.email}
        >
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="contact-topic"
          label="Topic"
          required
          error={errors.topic}
        >
          <select
            id="contact-topic"
            name="topic"
            required
            value={topic}
            onChange={(event) => setTopic(event.target.value as ContactTopic)}
            className={formInputClass}
          >
            {CONTACT_TOPICS.map((value) => (
              <option key={value} value={value}>
                {contactTopicLabels[value]}
              </option>
            ))}
          </select>
        </AccessibleFormField>

        <AccessibleFormField
          id="contact-message"
          label="Message"
          required
          error={errors.message}
        >
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={`${formInputClass} min-h-[9rem] resize-y`}
          />
        </AccessibleFormField>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-company">Company</label>
          <input
            id="contact-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`${mapablePublicPrimaryButtonClass} w-full sm:w-auto disabled:opacity-60`}
        >
          {status === "loading" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
