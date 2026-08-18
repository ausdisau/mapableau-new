/**
 * AccessibilityProfileForm - Refactored with New Accessibility System
 *
 * Uses new hooks:
 * - useAccessibilityAnnouncement() for screen reader feedback
 * - useMotionPreferencesSafe() for transition animations
 * - useFocusRing() for focus management
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";

import { AccessibilityPreferenceCard } from "@/components/accessibility/AccessibilityPreferenceCard";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  useAccessibilityAnnouncement,
  useMotionPreferencesSafe,
  useFocusRing,
} from "@/lib/accessibility";
import type { DigitalPreferences, TransportRequirements } from "@/types/mapable";

const MOBILITY_OPTIONS = [
  "manual_wheelchair",
  "power_wheelchair",
  "mobility_scooter",
  "walker",
  "cane",
  "assistance_animal",
  "none",
  "other",
] as const;

const COMM_OPTIONS = [
  "plain_language",
  "sms",
  "email",
  "phone",
  "aac",
  "auslan",
  "support_person",
  "written_only",
] as const;

export function AccessibilityProfileForm({
  initial,
}: {
  initial: {
    mobilityNeeds: string[];
    communicationPreferences: string[];
    transportRequirements: TransportRequirements;
    digitalPreferences: DigitalPreferences;
  };
}) {
  const router = useRouter();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Accessibility hooks
  const { announce } = useAccessibilityAnnouncement();
  const { transitionDuration } = useMotionPreferencesSafe();
  const { isFocused: btnFocused, focusStyle: btnFocusStyle } = useFocusRing();

  // Form state
  const [mobility, setMobility] = useState<string[]>(initial.mobilityNeeds);
  const [communication, setCommunication] = useState<string[]>(
    initial.communicationPreferences
  );
  const [transport, setTransport] = useState(initial.transportRequirements);
  const [digital, setDigital] = useState(initial.digitalPreferences);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value]
    );
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setStatus("");

      try {
        const res = await fetch("/api/accessibility-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobilityNeeds: mobility,
            communicationPreferences: communication,
            transportRequirements: transport,
            digitalPreferences: digital,
            sensoryPreferences: {},
            cognitivePreferences: {},
            shareWithProviders: {},
          }),
        });

        if (res.ok) {
          const successMsg =
            "Accessibility preferences saved successfully.";
          setStatus(successMsg);
          announce(successMsg, { priority: "polite" });

          // Restore focus to submit button and refresh page
          submitButtonRef.current?.focus();
          setTimeout(() => {
            router.refresh();
          }, 500);
        } else {
          const errorMsg =
            res.status === 401
              ? "You must be signed in to save preferences."
              : "Could not save preferences. Please try again.";
          setError(errorMsg);
          setStatus(errorMsg);
          announce(errorMsg, { priority: "assertive" });

          // Focus back on form for re-submission
          submitButtonRef.current?.focus();
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "An error occurred.";
        setError(errorMsg);
        setStatus(errorMsg);
        announce(errorMsg, { priority: "assertive" });
        submitButtonRef.current?.focus();
      } finally {
        setLoading(false);
      }
    },
    [mobility, communication, transport, digital, announce, router]
  );

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      aria-label="Accessibility preferences form"
    >
      {/* Status Message - Announced to Screen Readers */}
      {(status || error) && (
        <div
          ref={statusRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`
            rounded-lg border p-4 transition-all duration-300
            ${
              error
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-green-200 bg-green-50 text-green-900"
            }
          `}
          style={{ transitionDuration: transitionDuration }}
        >
          <p className="font-medium">
            {error ? "Error:" : "Success:"} {status}
          </p>
        </div>
      )}

      {/* Mobility Section */}
      <AccessibilityPreferenceCard
        title="Mobility"
        description="Equipment and mobility aids you use"
      >
        <fieldset>
          <legend className="sr-only">Mobility aids</legend>
          <div className="flex flex-wrap gap-2">
            {MOBILITY_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 hover:bg-accent transition-colors"
                style={{ transitionDuration: transitionDuration }}
              >
                <input
                  type="checkbox"
                  checked={mobility.includes(opt)}
                  onChange={() => toggle(mobility, opt, setMobility)}
                  aria-label={opt.replace(/_/g, " ")}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm">{opt.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </AccessibilityPreferenceCard>

      {/* Communication Section */}
      <AccessibilityPreferenceCard
        title="Communication"
        description="How you prefer to receive information"
      >
        <fieldset>
          <legend className="sr-only">Communication preferences</legend>
          <div className="flex flex-wrap gap-2">
            {COMM_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 hover:bg-accent transition-colors"
                style={{ transitionDuration: transitionDuration }}
              >
                <input
                  type="checkbox"
                  checked={communication.includes(opt)}
                  onChange={() => toggle(communication, opt, setCommunication)}
                  aria-label={opt.replace(/_/g, " ")}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm">{opt.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </AccessibilityPreferenceCard>

      {/* Transport Access Section */}
      <AccessibilityPreferenceCard
        title="Transport access"
        description="Requirements for accessible transport bookings"
      >
        <div className="space-y-3">
          {[
            ["requiresWheelchairAccessibleVehicle", "Wheelchair accessible vehicle"],
            ["canTransferFromWheelchair", "Can transfer from wheelchair"],
            ["requiresRamp", "Requires ramp"],
            ["assistanceAnimalPresent", "Assistance animal"],
            ["needsDriverAssistanceToDoor", "Driver assistance to door"],
            ["needsExtraBoardingTime", "Extra boarding time"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex min-h-10 items-center gap-2 hover:bg-accent rounded px-2 transition-colors cursor-pointer"
              style={{ transitionDuration: transitionDuration }}
            >
              <input
                type="checkbox"
                checked={Boolean(transport[key as keyof TransportRequirements])}
                onChange={(e) =>
                  setTransport({ ...transport, [key]: e.target.checked })
                }
                aria-label={label}
                className="h-4 w-4 cursor-pointer"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}

          {/* Pickup Notes Textarea */}
          <AccessibleFormField id="pickupNotes" label="Pickup notes">
            <textarea
              id="pickupNotes"
              className={formInputClass}
              rows={2}
              value={transport.pickupNotes ?? ""}
              onChange={(e) =>
                setTransport({ ...transport, pickupNotes: e.target.value })
              }
              placeholder="Any additional information for your driver"
              aria-describedby="pickupNotes-help"
            />
            <p id="pickupNotes-help" className="text-xs text-muted-foreground mt-1">
              Optional: Help your driver prepare for your pickup
            </p>
          </AccessibleFormField>
        </div>
      </AccessibilityPreferenceCard>

      {/* Digital Interface Section */}
      <AccessibilityPreferenceCard
        title="Digital interface"
        description="How MapAble should present information to you"
      >
        <fieldset>
          <legend className="sr-only">Digital preferences</legend>
          <div className="space-y-2">
            {[
              ["largeText", "Large text"],
              ["highContrast", "High contrast"],
              ["reducedMotion", "Reduced motion"],
              ["screenReaderUser", "Screen reader user"],
              ["simpleLanguageMode", "Simple language mode"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-10 items-center gap-2 hover:bg-accent rounded px-2 transition-colors cursor-pointer"
                style={{ transitionDuration: transitionDuration }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(digital[key as keyof DigitalPreferences])}
                  onChange={(e) =>
                    setDigital({ ...digital, [key]: e.target.checked })
                  }
                  aria-label={label}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </AccessibilityPreferenceCard>

      {/* Submit Button - With Focus Ring */}
      <Button
        ref={submitButtonRef}
        type="submit"
        variant="default"
        size="default"
        loading={loading}
        disabled={loading}
        style={btnFocused ? btnFocusStyle : {}}
        className="transition-all"
      >
        Save accessibility preferences
      </Button>

      {/* Hidden submit button for accessibility - always visible to screen readers */}
      <p className="sr-only" role="status">
        {loading ? "Saving preferences..." : ""}
      </p>
    </form>
  );
}
