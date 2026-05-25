export function canNotifyProviders(consentToNotify: boolean): boolean {
  return consentToNotify;
}

export function publicWaitlistFields(request: {
  requestedServiceType: string;
  suburb: string | null;
  status: string;
}) {
  return {
    requestedServiceType: request.requestedServiceType,
    suburb: request.suburb,
    status: request.status,
  };
}
