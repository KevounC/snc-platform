import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { OffsetImpact } from "../../../../src/components/emissions/offset-impact.js";

describe("OffsetImpact", () => {
  it("renders nothing for zero offset", () => {
    const { container } = render(<OffsetImpact offsetCo2Kg={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders impact cards for positive offset", () => {
    render(<OffsetImpact offsetCo2Kg={100} />);

    expect(screen.getByTestId("offset-impact")).toBeInTheDocument();
    expect(screen.getByText("Pika Project donation")).toBeInTheDocument();
    expect(screen.getByText("Grassland protected")).toBeInTheDocument();
  });

  it("displays donation amount", () => {
    // 100 kg → $3.00
    render(<OffsetImpact offsetCo2Kg={100} />);
    expect(screen.getByText("$3.00")).toBeInTheDocument();
  });
});
