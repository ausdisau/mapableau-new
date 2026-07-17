export interface SponsoredContentSlot {
  slotKey: string;
  organisationId: string;
  labelText: string;
  disclosureText: string;
}

const REQUIRED_LABEL = "Sponsored";

export function assertSponsoredLabel(slot: SponsoredContentSlot): void {
  if (!slot.labelText || !slot.labelText.toLowerCase().includes(REQUIRED_LABEL.toLowerCase())) {
    throw new Error("SPONSORED_LABEL_MISSING");
  }
  if (!slot.disclosureText || slot.disclosureText.length < 20) {
    throw new Error("SPONSORED_DISCLOSURE_MISSING");
  }
}
