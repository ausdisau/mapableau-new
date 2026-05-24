/**
 * @vitest-environment jsdom
 */
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { RegistrationRoleSelector } from "@/components/auth/RegistrationRoleSelector";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { getRegistrationOnboardingPath } from "@/lib/auth/role-router";
import { mapRegistrationTypeToPrimaryRole } from "@/lib/auth/registration-roles";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(async () => ({ ok: true })),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  mockRefresh.mockClear();
});

describe("AuthErrorSummary", () => {
  it("renders error list when errors exist", () => {
    render(<AuthErrorSummary errors={["Invalid password"]} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Invalid password")).toBeTruthy();
  });

  it("renders nothing when no errors", () => {
    const { container } = render(<AuthErrorSummary errors={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email address")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeTruthy();
  });

  it("shows error summary on empty submit", () => {
    const { container } = render(<LoginForm />);
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Enter your email address.")).toBeTruthy();
  });
});

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id: "u1" }),
      })) as unknown as typeof fetch,
    );
  });

  it("renders registration fields and role selector", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Full name")).toBeTruthy();
    expect(screen.getByLabelText("Email address")).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: /account type/i })).toBeTruthy();
  });

  it("redirects new providers to provider onboarding path", () => {
    const role = mapRegistrationTypeToPrimaryRole("provider");
    expect(getRegistrationOnboardingPath(role)).toBe("/provider/onboarding");
  });

  it("redirects to onboarding after successful registration", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Alex Example" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("radio", { name: /support worker/i }),
    );
    fireEvent.click(screen.getByRole("checkbox"));

    const form = document.querySelector("form");
    fireEvent.submit(form!);

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard?onboarding=profile");
    });
  });
});

describe("RegistrationRoleSelector", () => {
  it("changes selection with keyboard", () => {
    const onChange = vi.fn();
    render(
      <RegistrationRoleSelector value="participant" onChange={onChange} />,
    );

    const group = screen.getByRole("radiogroup", { name: /account type/i });
    const driverOption = within(group).getByRole("radio", { name: /driver/i });
    driverOption.focus();
    fireEvent.keyDown(driverOption, { key: " ", code: "Space" });
    fireEvent.click(driverOption);
    expect(onChange).toHaveBeenCalledWith("driver");
  });
});

describe("SocialLoginButtons", () => {
  it("exposes accessible labels for OAuth", () => {
    render(<SocialLoginButtons providers={["google", "azure-ad"]} />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /continue with microsoft/i }),
    ).toBeTruthy();
  });
});
