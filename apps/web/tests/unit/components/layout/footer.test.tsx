import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Footer } from "../../../../src/components/layout/footer.js";

describe("Footer", () => {
  it("renders AGPL-3.0 license link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /AGPL-3\.0/ });
    expect(link).toHaveAttribute(
      "href",
      "https://www.gnu.org/licenses/agpl-3.0.html",
    );
  });

  it("renders CC-BY-SA-4.0 license link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /CC-BY-SA-4\.0/ });
    expect(link).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
  });

  it("renders copyright year", () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
  });
});
