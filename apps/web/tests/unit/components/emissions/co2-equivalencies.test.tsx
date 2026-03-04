import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Hoisted Mocks ──

const { mockComputeEquivalencies } = vi.hoisted(() => ({
  mockComputeEquivalencies: vi.fn(),
}));

vi.mock("../../../../src/lib/co2-equivalencies.js", () => ({
  computeEquivalencies: mockComputeEquivalencies,
}));

// ── Component Under Test ──

import { Co2Equivalencies } from "../../../../src/components/emissions/co2-equivalencies.js";

// ── Tests ──

describe("Co2Equivalencies", () => {
  it("renders equivalency cards", () => {
    mockComputeEquivalencies.mockReturnValue([
      { label: "Miles driven", value: "24.8", unit: "miles" },
      { label: "Smartphone charges", value: "1,217", unit: "charges" },
    ]);

    render(<Co2Equivalencies co2Kg={10} />);

    expect(screen.getByTestId("co2-equivalencies")).toBeInTheDocument();
    expect(screen.getByText("24.8")).toBeInTheDocument();
    expect(screen.getByText("miles")).toBeInTheDocument();
    expect(screen.getByText("Miles driven")).toBeInTheDocument();
    expect(screen.getByText("1,217")).toBeInTheDocument();
  });

  it("returns null when no equivalencies", () => {
    mockComputeEquivalencies.mockReturnValue([]);

    const { container } = render(<Co2Equivalencies co2Kg={0} />);

    expect(container.innerHTML).toBe("");
  });
});
