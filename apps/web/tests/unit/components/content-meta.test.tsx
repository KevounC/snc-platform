import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ContentMeta } from "../../../src/components/content/content-meta.js";

describe("ContentMeta", () => {
  it("renders the title", () => {
    render(
      <ContentMeta title="My Title" creatorName="Alice" publishedAt={null} />,
    );
    expect(
      screen.getByRole("heading", { name: "My Title" }),
    ).toBeInTheDocument();
  });

  it("renders the creator name", () => {
    render(
      <ContentMeta title="My Title" creatorName="Alice" publishedAt={null} />,
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("renders the separator and date when publishedAt is provided", () => {
    render(
      <ContentMeta
        title="My Title"
        creatorName="Alice"
        publishedAt="2026-02-26T00:00:00.000Z"
      />,
    );
    expect(screen.getByText("·")).toBeInTheDocument();
    expect(screen.getByText("Feb 26, 2026")).toBeInTheDocument();
  });

  it("does not render separator or date when publishedAt is null", () => {
    render(
      <ContentMeta title="My Title" creatorName="Alice" publishedAt={null} />,
    );
    expect(screen.queryByText("·")).toBeNull();
  });

  it("renders date element with correct dateTime attribute", () => {
    const isoDate = "2026-02-26T00:00:00.000Z";
    render(
      <ContentMeta
        title="My Title"
        creatorName="Alice"
        publishedAt={isoDate}
      />,
    );
    const timeEl = screen.getByRole("time");
    expect(timeEl).toHaveAttribute("dateTime", isoDate);
  });
});
