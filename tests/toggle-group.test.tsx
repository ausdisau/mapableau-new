/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToggleGroup } from "@/components/ui/toggle-group";

afterEach(() => cleanup());

describe("ToggleGroup", () => {
  it("supports keyboard selection via radio inputs", () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup
        label="Mode"
        name="mode"
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ]}
      />,
    );
    fireEvent.click(screen.getByLabelText("Option B"));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
