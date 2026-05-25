export const metadata = {
  title: "Provider onboarding | MapAble",
  description:
    "Complete your organisation profile and verification for the MapAble provider network.",
};

export default function ProviderOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-3xl">{children}</div>;
}
