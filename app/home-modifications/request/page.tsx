import { HomeModificationRequestForm } from "@/components/home-modifications/HomeModificationRequestForm";
import { requireAuth } from "@/lib/auth/guards";

export default async function HomeModificationRequestPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">New home modification request</h1>
      <HomeModificationRequestForm />
    </div>
  );
}
