import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getOAuthButtonLabel } from "@/components/auth/OAuthSignInButtons";

const loginClientSource = readFileSync(
  join(process.cwd(), "app/login/LoginClient.tsx"),
  "utf8",
);

describe("LoginClient OAuth buttons", () => {
  it("uses login-specific Google and Facebook button labels", () => {
    expect(getOAuthButtonLabel("Google", "login")).toBe("Login with Google");
    expect(getOAuthButtonLabel("Facebook", "login")).toBe(
      "Login with Facebook",
    );
    expect(loginClientSource).toContain('labelMode="login"');
  });
});
