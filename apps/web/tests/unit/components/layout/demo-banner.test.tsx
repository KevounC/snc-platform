import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockDemoMode = vi.hoisted(() => ({ value: false }));

vi.mock("../../../../src/lib/config.js", () => ({
  get DEMO_MODE() {
    return mockDemoMode.value;
  },
}));

import { DemoBanner } from "../../../../src/components/layout/demo-banner.js";

describe("DemoBanner", () => {
  beforeEach(() => {
    mockDemoMode.value = false;
  });

  it("renders nothing when DEMO_MODE is false", () => {
    const { container } = render(<DemoBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders banner text when DEMO_MODE is true", () => {
    mockDemoMode.value = true;
    render(<DemoBanner />);
    expect(
      screen.getByText(/preview environment/),
    ).toBeInTheDocument();
  });

  it("has status role for accessibility", () => {
    mockDemoMode.value = true;
    render(<DemoBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
