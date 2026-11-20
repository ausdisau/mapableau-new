export interface PlannedService {
  id: string;
  participantToken: string; // pseudonymous, not for public dashboards
  scheduledStart: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'unknown';
  fallbackConfirmed: boolean;
  criticalContinuity: boolean; // declared operational priority, never inferred from diagnosis
}
export interface ContinuityAlert {
  serviceId: string;
  reason: 'cancelled_without_fallback' | 'critical_status_unknown';
  action: 'human_follow_up_required';
}

/** Only reports explicit service continuity gaps. Does not infer participant risk or incapacity. */
export function detectContinuityGaps(services: readonly PlannedService[]): ContinuityAlert[] {
  return services.flatMap((s): ContinuityAlert[] => {
    if (s.status === 'cancelled' && !s.fallbackConfirmed) {
      return [{ serviceId: s.id, reason: 'cancelled_without_fallback', action: 'human_follow_up_required' }];
    }
    if (s.criticalContinuity && s.status === 'unknown') {
      return [{ serviceId: s.id, reason: 'critical_status_unknown', action: 'human_follow_up_required' }];
    }
    return [];
  }).sort((a,b) => a.serviceId.localeCompare(b.serviceId));
}
