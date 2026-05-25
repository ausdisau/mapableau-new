import { UnmetNeedForm } from "@/components/unmet-needs/UnmetNeedForm";

export default function NewUnmetNeedPage() {
  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="font-heading text-2xl font-bold">Record an unmet need</h1>
      <UnmetNeedForm />
    </div>
  );
}
