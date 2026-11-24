// A static document has no per-request nonce. Allow only its integrity-checked script.
export const employmentGuideCsp = [
  "default-src 'none'",
  "script-src 'sha384-J4cJdzb9X96xvcgXwpMYo2uHQar4XQ5RoC/yUSUQ7ndaY0HKPBTiLtlonzfL0Bxv'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");
