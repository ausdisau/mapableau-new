export function explainSignal(category: string): string {
  const map: Record<string, string> = {
    verification_status: "Shows whether key business and safety checks are recorded.",
    booking_completion_rate: "Based on completed bookings, not star ratings.",
    incident_rate: "Incidents are reviewed internally; details stay private.",
    capacity_reliability: "Reflects declared capacity and waitlist responsiveness.",
  };
  return map[category] ?? "Explainable indicator — not a guarantee of safety or fit.";
}
