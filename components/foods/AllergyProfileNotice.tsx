export function AllergyProfileNotice({
  allergens,
  warnings,
}: {
  allergens: string[];
  warnings?: string[];
}) {
  if (!allergens.length && !warnings?.length) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-amber-600 bg-amber-50 p-4 text-amber-950"
    >
      <h2 className="font-semibold">Allergen information</h2>
      {warnings && warnings.length > 0 ? (
        <p className="mt-2 text-sm font-medium">
          This order may contain: {warnings.join(", ")}. Please check each item before eating.
        </p>
      ) : (
        <p className="mt-2 text-sm">
          Your profile lists: {allergens.join(", ")}. Review product allergen tags at checkout.
        </p>
      )}
    </div>
  );
}
