import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { BandcampEmbed } from "../../../src/components/bandcamp/bandcamp-embed.js";
import { BandcampSection } from "../../../src/components/bandcamp/bandcamp-section.js";
import { MOCK_BANDCAMP_EMBED_URL } from "../../helpers/creator-fixtures.js";

// ── Test Data ──

const ALBUM_EMBED_URL =
  "https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/bgcol=333333";
const TRACK_EMBED_URL =
  "https://bandcamp.com/EmbeddedPlayer/track=987654321/size=small/bgcol=333333";
const NO_SIZE_EMBED_URL =
  "https://bandcamp.com/EmbeddedPlayer/album=123456789";

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("BandcampEmbed", () => {
  it("renders iframe with correct src attribute", () => {
    render(<BandcampEmbed url={MOCK_BANDCAMP_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toHaveAttribute("src", MOCK_BANDCAMP_EMBED_URL);
  });

  it("sets sandbox attributes correctly", () => {
    render(<BandcampEmbed url={ALBUM_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-popups allow-scripts allow-same-origin",
    );
  });

  it("sets loading to lazy", () => {
    render(<BandcampEmbed url={ALBUM_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toHaveAttribute("loading", "lazy");
  });

  it("uses 470px height for album embeds (default / size=large)", () => {
    render(<BandcampEmbed url={ALBUM_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toHaveAttribute("height", "470");
  });

  it("uses 120px height for track embeds (size=small)", () => {
    render(<BandcampEmbed url={TRACK_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toHaveAttribute("height", "120");
  });

  it("uses 470px height when URL has no size parameter", () => {
    render(<BandcampEmbed url={NO_SIZE_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toHaveAttribute("height", "470");
  });

  it("has accessible title attribute", () => {
    render(<BandcampEmbed url={ALBUM_EMBED_URL} />);

    const iframe = screen.getByTitle("Bandcamp Player");
    expect(iframe).toBeInTheDocument();
  });
});

describe("BandcampSection", () => {
  it("returns nothing when bandcampUrl is null and bandcampEmbeds is empty", () => {
    const { container } = render(
      <BandcampSection bandcampUrl={null} bandcampEmbeds={[]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders section heading when embeds exist", () => {
    render(
      <BandcampSection bandcampUrl={null} bandcampEmbeds={[ALBUM_EMBED_URL]} />,
    );

    expect(screen.getByText("Bandcamp")).toBeInTheDocument();
  });

  it("renders section heading when only bandcampUrl is set", () => {
    render(
      <BandcampSection
        bandcampUrl="https://myband.bandcamp.com"
        bandcampEmbeds={[]}
      />,
    );

    expect(screen.getByText("Bandcamp")).toBeInTheDocument();
  });

  it("renders one iframe per embed URL", () => {
    render(
      <BandcampSection
        bandcampUrl={null}
        bandcampEmbeds={[ALBUM_EMBED_URL, TRACK_EMBED_URL]}
      />,
    );

    const iframes = screen.getAllByTitle("Bandcamp Player");
    expect(iframes).toHaveLength(2);
    expect(iframes[0]).toHaveAttribute("src", ALBUM_EMBED_URL);
    expect(iframes[1]).toHaveAttribute("src", TRACK_EMBED_URL);
  });

  it("renders 'View on Bandcamp' link when bandcampUrl is set", () => {
    render(
      <BandcampSection
        bandcampUrl="https://myband.bandcamp.com"
        bandcampEmbeds={[]}
      />,
    );

    const link = screen.getByRole("link", { name: "View on Bandcamp" });
    expect(link).toHaveAttribute("href", "https://myband.bandcamp.com");
  });

  it("View on Bandcamp link opens in new tab", () => {
    render(
      <BandcampSection
        bandcampUrl="https://myband.bandcamp.com"
        bandcampEmbeds={[]}
      />,
    );

    const link = screen.getByRole("link", { name: "View on Bandcamp" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render link when bandcampUrl is null but embeds exist", () => {
    render(
      <BandcampSection bandcampUrl={null} bandcampEmbeds={[ALBUM_EMBED_URL]} />,
    );

    expect(
      screen.queryByRole("link", { name: "View on Bandcamp" }),
    ).toBeNull();
    expect(screen.getByTitle("Bandcamp Player")).toBeInTheDocument();
  });

  it("renders both embeds and link when both are provided", () => {
    render(
      <BandcampSection
        bandcampUrl="https://myband.bandcamp.com"
        bandcampEmbeds={[ALBUM_EMBED_URL, TRACK_EMBED_URL]}
      />,
    );

    const iframes = screen.getAllByTitle("Bandcamp Player");
    expect(iframes).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "View on Bandcamp" }),
    ).toBeInTheDocument();
  });
});
