/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PublicGuidedPath } from "@/components/ask-mapable/PublicGuidedPath";
import {
  initialPublicGuide,
  reducePublicGuide,
  reviewPublicGuide,
  type PublicGuideGoal,
} from "@/lib/ask-mapable/dialogue/public-guided-flow";

afterEach(() => cleanup());

describe("public Companion structured dialogue", () => {
  it("only accepts reviewed goals and never creates a free-text destination", () => {
    const start = initialPublicGuide();
    expect(reducePublicGuide(start, { type: "choose_goal", goal: "payment" as PublicGuideGoal }))
      .toEqual(start);
    let next = reducePublicGuide(start, { type: "choose_goal", goal: "providers" });
    next = reducePublicGuide(next, { type: "set_location", value: "Parramatta?patient=secret" });
    next = reducePublicGuide(next, { type: "next" });
    next = reducePublicGuide(next, { type: "set_access", value: "AAC and readable text" });
    next = reducePublicGuide(next, { type: "next" });
    expect(reviewPublicGuide(next)).toMatchObject({
      href: "/provider-finder",
      location: "Parramatta?patient=secret",
      access: "AAC and readable text",
    });
    expect(reviewPublicGuide(next)?.href).not.toContain("patient");
  });

  it("lets users skip, go back, correct and restart without losing control", () => {
    let state = reducePublicGuide(initialPublicGuide(), { type: "choose_goal", goal: "transport" });
    state = reducePublicGuide(state, { type: "set_location", value: "Sydney" });
    state = reducePublicGuide(state, { type: "skip" });
    expect(state).toMatchObject({ step: "access", location: "" });
    state = reducePublicGuide(state, { type: "set_access", value: "step-free entry" });
    state = reducePublicGuide(state, { type: "next" });
    expect(state.step).toBe("review");
    state = reducePublicGuide(state, { type: "edit", field: "access" });
    expect(state.access).toBe("step-free entry");
    state = reducePublicGuide(state, { type: "set_access", value: "large text" });
    state = reducePublicGuide(state, { type: "next" });
    expect(reviewPublicGuide(state)?.access).toBe("large text");
    expect(reducePublicGuide(state, { type: "restart" })).toEqual(initialPublicGuide());
  });

  it("keeps requests short and strips control characters without inventing status", () => {
    let state = reducePublicGuide(initialPublicGuide(), { type: "choose_goal", goal: "care" });
    state = reducePublicGuide(state, { type: "set_location", value: "A".repeat(140) + "\n" });
    expect(state.location.length).toBe(80);
    state = reducePublicGuide(state, { type: "next" });
    state = reducePublicGuide(state, { type: "set_access", value: "A\nB\tC" });
    expect(state.access).toBe("A B C");
    state = reducePublicGuide(state, { type: "next" });
    expect(reviewPublicGuide(state)?.description).not.toMatch(/worker cleared|guaranteed available/i);
  });

  it("human support bypasses information-collection steps", () => {
    let state = reducePublicGuide(initialPublicGuide(), { type: "choose_goal", goal: "human" });
    expect(state.step).toBe("review");
    expect(reviewPublicGuide(state)?.href).toBe("/contact");
    state = reducePublicGuide(state, { type: "back" });
    expect(state.step).toBe("goal");
  });
});

describe("accessible, non-AI guided path", () => {
  it("supports keyboard steps, review and editing with no private URL parameters", async () => {
    const user = userEvent.setup();
    render(<PublicGuidedPath />);
    expect(screen.getByRole("heading", { name: "Guided discovery, without AI" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Find a support provider/i }));
    const location = screen.getByRole("textbox", { name: /Is there a suburb or area/i });
    expect(document.activeElement).toBe(location);
    await user.type(location, "Parramatta");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const access = screen.getByRole("textbox", { name: /Which access features matter/i });
    expect(document.activeElement).toBe(access);
    await user.type(access, "AAC-friendly communication");
    await user.click(screen.getByRole("button", { name: "Review choices" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Review your choices" }));
    expect(screen.getByText("Parramatta")).toBeTruthy();
    expect(screen.getByText("AAC-friendly communication")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Open Provider Finder" });
    expect(link.getAttribute("href")).toBe("/provider-finder");
    await user.click(screen.getByRole("button", { name: "Edit area" }));
    const locationAgain = screen.getByRole("textbox", { name: /Is there a suburb or area/i });
    await user.clear(locationAgain);
    await user.type(locationAgain, "Newcastle");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Review choices" }));
    expect(screen.getByText("Newcastle")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open Provider Finder" }).getAttribute("href"))
      .toBe("/provider-finder");
  });

  it("offers skip, reset, and a human route without diagnosis or timer", async () => {
    const user = userEvent.setup();
    render(<PublicGuidedPath />);
    await user.click(screen.getByRole("button", { name: /Explore inclusive employment/i }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("link", { name: "Explore Employment" }).getAttribute("href"))
      .toBe("/employment");
    await user.click(screen.getByRole("button", { name: "Start again" }));
    await user.click(screen.getByRole("button", { name: /Talk to a person/i }));
    expect(screen.getByRole("link", { name: "Contact MapAble" }).getAttribute("href"))
      .toBe("/contact");
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
