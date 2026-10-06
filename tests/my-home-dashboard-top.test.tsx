/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { MyHomeDashboardTop } from "@/components/personal-agency/MyHomeDashboardTop";

afterEach(() => {
  cleanup();
});

describe("MyHomeDashboardTop", () => {
  it("renders the participant goal, truthful counts and primary destinations", () => {
    render(
      <MyHomeDashboardTop
        greeting="Good morning"
        firstName="Alex"
        dateLabel="Wednesday, 7 October"
        goal={{
          id: "goal-1",
          originalExpression: "I want a job I can travel to independently.",
        }}
        lifeIntentsEnabled
        todayBookingsCount={2}
        careRequestCount={1}
        upcomingTransportCount={3}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /My MapAble.*Good morning, Alex/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("I want a job I can travel to independently."),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /continue my goal/i }).getAttribute("href"),
    ).toBe("/my/life/goal-1");

    expect(screen.getByText("2 activities today")).toBeTruthy();
    expect(screen.getByText("1 active care request")).toBeTruthy();
    expect(screen.getByText("3 upcoming trips")).toBeTruthy();

    expect(
      screen.getByRole("link", { name: /accessibility map/i }).getAttribute("href"),
    ).toBe("/access");
    expect(
      screen.getByRole("link", { name: /ask mapable/i }).getAttribute("href"),
    ).toBe("/my/ask");
  });

  it("offers participant-authored goal creation without inventing a goal", () => {
    render(
      <MyHomeDashboardTop
        greeting="Good afternoon"
        firstName="Alex"
        dateLabel="Wednesday, 7 October"
        goal={null}
        lifeIntentsEnabled
        todayBookingsCount={0}
        careRequestCount={0}
        upcomingTransportCount={0}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /start with something that matters/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /set a goal/i }).getAttribute("href"),
    ).toBe("/my/life/new");
    expect(screen.getByText("0 activities today")).toBeTruthy();
  });
});
