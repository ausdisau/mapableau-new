// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmploymentPathways } from "@/components/jobs/EmploymentPathways";
import { NewJobForm } from "@/components/jobs/NewJobForm";
import { RoleBrief } from "@/components/jobs/RoleBrief";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
const orgs = [{ id: "radio", name: "Example radio" }];

describe("skills-first Employment screens", () => {
  it("makes core, optional and missing skills legible to candidates", () => {
    const { rerender } = render(
      <RoleBrief
        skills={[
          {
            id: "1",
            label: "Plan a programme",
            description: null,
            isEssential: true,
          },
          {
            id: "2",
            label: "Edit audio",
            description: null,
            isEssential: false,
          },
        ]}
        instructions="Send an outline or a transcript."
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Skills needed at the start" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Additional skills (optional)" }),
    ).toBeTruthy();
    expect(screen.getByText("Send an outline or a transcript.")).toBeTruthy();
    rerender(<RoleBrief skills={[]} instructions={null} />);
    expect(screen.getByText(/hasn’t listed individual skills/)).toBeTruthy();
  });
  it("sends skills and evidence formats from the employer’s form and keeps text after a failure", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        Response.json({ job: { id: "one" } }, { status: 201 }),
      );
    vi.stubGlobal("fetch", send);
    render(<NewJobForm organisations={orgs} skillsEnabled />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Producer" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Plan a radio show." },
    });
    const skills = screen.getByLabelText("Skills needed at the start");
    fireEvent.change(skills, { target: { value: "Plan episodes" } });
    fireEvent.change(
      screen.getByLabelText("Additional skills (optional for applicants)"),
      { target: { value: "Edit audio" } },
    );
    fireEvent.change(
      screen.getByLabelText("How can applicants demonstrate their skills?"),
      { target: { value: "Send an outline." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((skills as HTMLTextAreaElement).value).toBe("Plan episodes");
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/employer/jobs/one"),
    );
    expect(JSON.parse(send.mock.calls[1][1].body)).toMatchObject({
      employerOrganisationId: "radio",
      applicationInstructions: "Send an outline.",
      skills: [
        { label: "Plan episodes", isEssential: true },
        { label: "Edit audio", isEssential: false },
      ],
    });
  });
  it("keeps the public example distinct from the signed-in pilot", () => {
    render(<EmploymentPathways />);
    expect(screen.getByText(/three fictional roles/i)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Open the Jobs guide" })
        .getAttribute("href"),
    ).toBe("/employment/guide/index.html");
    expect(
      screen
        .getByRole("link", { name: "Browse pilot roles" })
        .getAttribute("href"),
    ).toBe("/dashboard/jobs");
    expect(
      screen
        .getByRole("link", { name: "Create a job draft" })
        .getAttribute("href"),
    ).toBe("/employer/jobs/new");
  });
  it("keeps the legacy form usable with the pilot disabled", () => {
    render(<NewJobForm organisations={orgs} skillsEnabled={false} />);
    expect(screen.queryByText("Skills needed at the start")).toBeNull();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeTruthy();
  });
});
