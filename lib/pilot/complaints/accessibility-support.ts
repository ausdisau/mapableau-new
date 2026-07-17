export type AccessibilityComplaintSupport = {
  channels: string[];
  accommodations: string[];
  notes: string;
};

export function accessibilityComplaintSupports(): AccessibilityComplaintSupport {
  return {
    channels: ["phone", "email", "in_person", "advocate", "easy_read"],
    accommodations: [
      "interpreter",
      "screen_reader_compatible_form",
      "extended_response_time",
      "support_person_present",
    ],
    notes:
      "Complaints must remain accessible; anonymity available without reducing safety response.",
  };
}
