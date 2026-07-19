"use client";

export type FormErrorItem = {
  id: string;
  message: string;
};

export function FormErrorSummary({
  title = "There is a problem",
  errors,
}: {
  title?: string;
  errors: FormErrorItem[];
}) {
  if (errors.length === 0) return null;

  return (
    <div
      className="rounded-xl border-2 border-rose-700 bg-rose-50 p-4 text-rose-950"
      role="alert"
      aria-labelledby="form-error-summary-title"
      tabIndex={-1}
      id="form-error-summary"
    >
      <h2 id="form-error-summary-title" className="text-base font-black">
        {title}
      </h2>
      <p className="mt-1 text-sm">
        {errors.length === 1
          ? "1 error needs to be fixed before you can continue."
          : `${errors.length} errors need to be fixed before you can continue.`}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold">
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              className="underline underline-offset-2 mapable-focus"
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(error.id);
                if (!target) return;
                if (typeof target.focus === "function") {
                  target.focus();
                }
                if (typeof target.scrollIntoView === "function") {
                  target.scrollIntoView({ block: "center", behavior: "smooth" });
                }
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
