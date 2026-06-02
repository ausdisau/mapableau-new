/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginClient from "@/app/login/LoginClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("LoginClient OAuth buttons", () => {
  it("renders Google and Facebook login buttons when providers are enabled", () => {
    render(
      <LoginClient
        oauthProviders={{
          google: true,
          microsoft: false,
          facebook: true,
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /login with google/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /login with facebook/i }),
    ).toBeTruthy();
  });
});
