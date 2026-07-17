import { createRegistrationApplication } from "@/lib/assurance/registration/provider-registration-service";

/** Digital platform pathway helper — always tracks 0137 when requested. */
export async function startDigitalPlatformRegistration(params: {
  organisationId: string;
  include0137?: boolean;
  additionalGroups?: string[];
  ownerUserId?: string | null;
}) {
  const groups = new Set(params.additionalGroups ?? []);
  if (params.include0137 !== false) {
    groups.add("0137");
  }

  return createRegistrationApplication({
    organisationId: params.organisationId,
    pathway: "digital_platform",
    registrationGroups: [...groups],
    ownerUserId: params.ownerUserId,
  });
}
