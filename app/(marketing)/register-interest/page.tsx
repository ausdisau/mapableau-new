import Link from "next/link";

import { ProviderInterestForm } from "@/components/marketing/ProviderInterestForm";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  mapablePublicPageContainerClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Register provider interest | MapAble",
  description:
    "Expression of interest for organisations considering a controlled MapAble Support Cloud pilot.",
  alternates: canonicalAlternate("/register-interest"),
};

export default function RegisterInterestPage() {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
            Register interest
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3 max-w-3xl`}>
            Controlled provider pilot
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Tell MapAble about your organisation. This is separate from the
            general{" "}
            <Link href="/contact" className="font-black text-[#005B7F] underline">
              contact form
            </Link>
            . Registering interest does not activate a domain or an integration.
          </p>
        </div>
      </section>
      <section className={`${mapablePublicPageContainerClass} py-12`}>
        <div className="max-w-3xl">
          <ProviderInterestForm />
        </div>
      </section>
    </div>
  );
}
