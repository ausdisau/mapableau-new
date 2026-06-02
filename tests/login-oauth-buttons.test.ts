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
    expect(loginClientSource).toContain('labelMode="login"');
  });

  it("maps NextAuth runtime providers to social sign-in flags", () => {
    expect(
      oauthProviderFlagsFromNextAuthProviders([
        "auth0",
        "google",
        "azure-ad",
        "facebook",
        "credentials",
      ]),
    ).toEqual({
      auth0: true,
      google: true,
      microsoft: true,
      facebook: true,
    });
  });

  it("keeps Google and Microsoft login public-facing when runtime providers omit them", () => {
    expect(
      publicOAuthProviderFlags({
        auth0: false,
        google: false,
        microsoft: false,
        facebook: false,
      }),
    ).toEqual({
      auth0: false,
      google: true,
      microsoft: true,
      facebook: false,
    });
  });

  it("renders the social login block on public auth pages", () => {
    expect(loginClientSource).toContain("<OAuthSignInButtons");
    expect(loginClientSource).not.toContain("{hasOAuth ?");
    expect(registerClientSource).toContain("<OAuthSignInButtons");
    expect(registerClientSource).not.toContain("{hasOAuth ?");
  });
});
