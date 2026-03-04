import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ScopeBreakdown } from "../../../../src/components/emissions/scope-breakdown.js";

describe("ScopeBreakdown", () => {
  it("renders scope rows with labels and formatted CO2", () => {
    const data = [
      { scope: 2, co2Kg: 0.034 },
      { scope: 3, co2Kg: 1.5 },
    ];

    render(<ScopeBreakdown data={data} />);

    expect(screen.getByText("Scope 2 (Energy)")).toBeDefined();
    expect(screen.getByText("Scope 3 (Value Chain)")).toBeDefined();
    expect(screen.getByText("34.0 g")).toBeDefined();
    expect(screen.getByText("1.5 kg")).toBeDefined();
  });

  it("shows empty message when data is empty", () => {
    render(<ScopeBreakdown data={[]} />);

    expect(screen.getByText("No scope data available")).toBeDefined();
  });

  it("does not render an Entries column", () => {
    const data = [{ scope: 2, co2Kg: 0.5 }];

    render(<ScopeBreakdown data={data} />);

    expect(screen.queryByText("Entries")).toBeNull();
  });
});
