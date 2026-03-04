import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { makeMockCreatorListItem } from "../../../helpers/creator-fixtures.js";

// ── Hoisted Mocks ──

const { mockApiGet } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    Link: ({ to, children, className, ...rest }: Record<string, unknown>) =>
      React.createElement(
        "a",
        { href: to as string, className, ...rest },
        children as React.ReactNode,
      ),
  };
});

vi.mock("../../../../src/lib/fetch-utils.js", () => ({
  apiGet: mockApiGet,
}));

// ── Import component under test (after mocks) ──

import { FeaturedCreators } from "../../../../src/components/landing/featured-creators.js";

// ── Test Lifecycle ──

beforeEach(() => {
  mockApiGet.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("FeaturedCreators", () => {
  describe("loading state", () => {
    it("shows loading text while fetching", () => {
      // Never-resolving promise keeps component in loading state
      mockApiGet.mockReturnValue(new Promise(() => {}));

      render(<FeaturedCreators />);

      expect(screen.getByText("Loading creators...")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Featured Creators" }),
      ).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("renders section heading 'Featured Creators'", async () => {
      mockApiGet.mockResolvedValue({
        items: [makeMockCreatorListItem()],
        nextCursor: null,
      });

      render(<FeaturedCreators />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 2, name: "Featured Creators" }),
        ).toBeInTheDocument();
      });
    });

    it("renders creator cards from fetched data", async () => {
      const creators = [
        makeMockCreatorListItem({ userId: "u1", displayName: "Alice" }),
        makeMockCreatorListItem({ userId: "u2", displayName: "Bob" }),
        makeMockCreatorListItem({ userId: "u3", displayName: "Carol" }),
      ];
      mockApiGet.mockResolvedValue({ items: creators, nextCursor: null });

      render(<FeaturedCreators />);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Carol")).toBeInTheDocument();
    });

    it("calls apiGet with correct endpoint and limit", async () => {
      mockApiGet.mockResolvedValue({
        items: [makeMockCreatorListItem()],
        nextCursor: null,
      });

      render(<FeaturedCreators />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith("/api/creators", { limit: 8 });
      });
    });

    it("scroll container has role='region' and aria-label", async () => {
      mockApiGet.mockResolvedValue({
        items: [makeMockCreatorListItem()],
        nextCursor: null,
      });

      render(<FeaturedCreators />);

      await waitFor(() => {
        const region = screen.getByRole("region", {
          name: "Featured creators",
        });
        expect(region).toBeInTheDocument();
      });
    });
  });

  describe("error and empty states", () => {
    it("shows empty message when API returns empty items array", async () => {
      mockApiGet.mockResolvedValue({ items: [], nextCursor: null });

      const { getByText } = render(<FeaturedCreators />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalled();
      });

      expect(getByText(/No creators yet/)).toBeTruthy();
    });

    it("returns null on fetch error", async () => {
      mockApiGet.mockRejectedValue(new Error("Network error"));

      const { container } = render(<FeaturedCreators />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalled();
      });

      // Component returns null — nothing rendered
      expect(container.innerHTML).toBe("");
    });
  });
});
