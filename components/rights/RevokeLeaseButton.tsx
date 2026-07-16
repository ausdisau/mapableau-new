"use client";

type RevokeButtonProps = {
  leaseId: string;
};

export function RevokeLeaseButton({ leaseId }: RevokeButtonProps) {
  async function handleRevoke() {
    const res = await fetch("/api/rights/active-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaseId }),
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <button
      type="button"
      className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
      onClick={handleRevoke}
    >
      Revoke
    </button>
  );
}
