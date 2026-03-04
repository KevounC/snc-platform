import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CategoryBreakdown } from "../../../../src/components/emissions/category-breakdown.js";

describe("CategoryBreakdown", () => {
  it("renders category rows with formatted CO2", () => {
    const data = [
      { category: "cloud-compute", co2Kg: 0.034 },
      { category: "vinyl-pressing", co2Kg: 1000 },
    ];

    render(<CategoryBreakdown data={data} />);

    expect(screen.getByText("cloud-compute")).toBeDefined();
    expect(screen.getByText("vinyl-pressing")).toBeDefined();
    expect(screen.getByText("34.0 g")).toBeDefined();
    expect(screen.getByText("1000.0 kg")).toBeDefined();
  });

  it("shows empty message when data is empty", () => {
    render(<CategoryBreakdown data={[]} />);

    expect(screen.getByText("No category data available")).toBeDefined();
  });

  it("does not render an Entries column", () => {
    const data = [{ category: "cloud-compute", co2Kg: 0.5 }];

    render(<CategoryBreakdown data={data} />);

    expect(screen.queryByText("Entries")).toBeNull();
  });
});
