import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getOAuthButtonLabel,
  oauthProviderFlagsFromNextAuthProviders,
  publicOAuthProviderFlags,
} from "@/components/auth/OAuthSignInButtons";

const loginClientSource = readFileSync(
  join(process.cwd(), "app/login/LoginClient.tsx"),
  "utf8",
);
const registerClientSource = readFileSync(
  join(process.cwd(), "app/register/RegisterClient.tsx"),
  "utf8",
);

describe("LoginClient OAuth buttons", () => {
  it("uses login-specific social sign-in button labels", () => {
    expect(getOAuthButtonLabel("Auth0", "login")).toBe("Login with Auth0");
    expect(getOAuthButtonLabel("Google", "login")).toBe("Login with Google");
    expect(getOAuthButtonLabel("Microsoft", "login")).toBe(
      "Login with Microsoft",
    );
    expect(getOAuthButtonLabel("Facebook", "login")).toBe(
      "Login with Facebook",
    );
    expect(getOAuthButtonLabel("Apple", "login")).toBe("Login with Apple");
    expect(loginClientSource).toContain('labelMode="login"');
  });

  it("maps NextAuth runtime providers to social sign-in flags", () => {
    expect(
      oauthProviderFlagsFromNextAuthProviders([
        "workos-authkit",
        "auth0",
        "google",
        "azure-ad",
        "facebook",
        "apple",
        "credentials",
      ]),
    ).toEqual({
      workosAuthKit: true,
      auth0: true,
      google: true,
      microsoft: true,
      facebook: true,
      apple: true,
    });
  });

  it("only shows OAuth providers that are actually configured", () => {
    expect(
      publicOAuthProviderFlags({
        workosAuthKit: true,
        auth0: false,
        google: false,
        microsoft: false,
        facebook: true,
        apple: false,
      }),
    ).toEqual({
      workosAuthKit: true,
      auth0: false,
      google: false,
      microsoft: false,
      facebook: true,
      apple: false,
    });
  });

  it("presents the hosted sign-in as a labelled, understandable option", () => {
    const source = readFileSync(
      join(process.cwd(), "components/auth/OAuthSignInButtons.tsx"),
      "utf8",
    );
    expect(source).toContain('aria-label="Secure account options"');
    expect(source).toContain("Sign in securely with MapAble");
    expect(source).toContain("powered by WorkOS");
    expect(source).toContain('screen_hint: labelMode === "login"');
  });

  it("renders the social login block on public auth pages", () => {
    expect(loginClientSource).toContain("<OAuthSignInButtons");
    expect(loginClientSource).not.toContain("{hasOAuth ?");
    expect(registerClientSource).toContain("<OAuthSignInButtons");
    expect(registerClientSource).not.toContain("{hasOAuth ?");
  });

  it("uses the accessible MapAble brand mark on both auth entry pages", () => {
    const loginPageSource = readFileSync(
      join(process.cwd(), "app/login/page.tsx"),
      "utf8",
    );
    const registerPageSource = readFileSync(
      join(process.cwd(), "app/register/page.tsx"),
      "utf8",
    );
    for (const source of [loginPageSource, registerPageSource]) {
      expect(source).toContain('<MapAbleLogo variant="mark"');
      expect(source).toContain('ariaLabel="MapAble home"');
    }
  });
});
