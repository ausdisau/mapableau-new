export function SecurePortalNotice() {
  return (
    <aside
      className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground"
      role="note"
    >
      <p>
        MapAble is operated by Australian Disability Ltd. You are signing in
        securely through{" "}
        <span className="font-medium">login.ad.org.au</span>.
      </p>
      <p className="mt-2 text-muted-foreground">
        You are entering the secure MapAble portal. Wix membership does not
        grant access to participant data, bookings, or provider tools.
      </p>
    </aside>
  );
}
