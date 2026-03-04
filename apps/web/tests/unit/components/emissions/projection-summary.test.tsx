import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../../src/components/dashboard/kpi-card.js", async () => {
  const React = await import("react");
  return {
    KpiCard: ({ label, value, sublabel, isLoading }: Record<string, unknown>) =>
      React.createElement(
        "div",
        { "data-testid": `kpi-${label}` },
        isLoading === true ? "Loading..." : String(value),
        sublabel ? React.createElement("span", null, ` (${sublabel})`) : null,
      ),
  };
});

import { ProjectionSummary } from "../../../../src/components/emissions/projection-summary.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProjectionSummary", () => {
  it("displays projected gross, offset target, gap, and donation amount", () => {
    render(
      <ProjectionSummary
        projectedGrossCo2Kg={1168}
        offsetCo2Kg={1000}
        doubleOffsetTargetCo2Kg={2336}
        additionalOffsetCo2Kg={1336}
      />,
    );

    expect(screen.getByTestId("kpi-Projected Gross")).toHaveTextContent("1168.0 kg");
    expect(screen.getByTestId("kpi-Current Offsets")).toHaveTextContent("1000.0 kg");
    expect(screen.getByTestId("kpi-2x Offset Target")).toHaveTextContent("2336.0 kg");
    expect(screen.getByTestId("kpi-Offset Gap")).toHaveTextContent("1336.0 kg");
    // $30/tonne × 1.336 tonnes = ~$40
    expect(screen.getByText(/Additional Pika Project donation needed/)).toBeInTheDocument();
    expect(screen.getByText("$40")).toBeInTheDocument();
  });

  it("shows zero gap message when offsets exceed 2x target", () => {
    render(
      <ProjectionSummary
        projectedGrossCo2Kg={100}
        offsetCo2Kg={1000}
        doubleOffsetTargetCo2Kg={200}
        additionalOffsetCo2Kg={0}
      />,
    );

    expect(screen.getByText(/already meet or exceed/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <ProjectionSummary
        projectedGrossCo2Kg={0}
        offsetCo2Kg={0}
        doubleOffsetTargetCo2Kg={0}
        additionalOffsetCo2Kg={0}
        isLoading
      />,
    );

    expect(screen.getByTestId("kpi-Projected Gross")).toHaveTextContent("Loading...");
  });
});
