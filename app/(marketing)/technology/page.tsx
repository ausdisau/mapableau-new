import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Technology and integrations | MapAble",
  description:
    "Planned MapAble interoperability with accounting, payments and NDIS provider tools. These integrations are not live.",
  alternates: canonicalAlternate("/technology"),
};

const planned = [
  {
    name: "Xero",
    detail:
      "Accounting export is planned. MapAble does not sync live invoices to Xero from this public site.",
  },
  {
    name: "Stripe",
    detail:
      "Card payments are planned for later controlled use. This marketing site does not take payments.",
  },
  {
    name: "TPP Wholesale",
    detail:
      "Wholesale domain tooling has been reviewed as a reference only. MapAble does not sell domains or cPanel hosting here.",
  },
  {
    name: "NDIS provider-management applications",
    detail:
      "Interoperability with common provider systems is a design goal. MapAble does not submit NDIA claims from these public pages.",
  },
];

export default function TechnologyPage() {
  return (
    <PublicInfoPage
      eyebrow="Technology and integrations"
      title="Planned connections, clearly labelled."
      description="The names below are integration directions. None of them is a live connection on the public website."
      ctaLabel="Register provider interest"
      ctaHref="/register-interest"
      sections={planned.map((item) => ({
        title: `${item.name} — planned`,
        content: <p>{item.detail}</p>,
      }))}
    />
  );
}
