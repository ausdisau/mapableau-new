import { requireAuth } from "@/lib/auth/guards";
import { createDeletionRequest } from "@/lib/privacy/data-deletion-service";

export const metadata = { title: "Delete my data" };

export default async function DeleteAccountPage() {
  await requireAuth();

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Request data deletion</h1>
      <p className="text-sm text-muted-foreground">
        Some records may be kept where the law or NDIS rules require it. An admin will review your request.
      </p>
      <form
        action={async () => {
          "use server";
          const user = await requireAuth();
          await createDeletionRequest(user.id, "Participant self-service request");
        }}
      >
        <button
          type="submit"
          className="min-h-12 w-full rounded-lg border border-destructive px-4 text-destructive"
        >
          Submit deletion request
        </button>
      </form>
    </main>
  );
}
