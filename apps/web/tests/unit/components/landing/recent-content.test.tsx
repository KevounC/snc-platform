import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { makeMockFeedItem } from "../../../helpers/content-fixtures.js";

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

import { RecentContent } from "../../../../src/components/landing/recent-content.js";

// ── Test Lifecycle ──

beforeEach(() => {
  mockApiGet.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("RecentContent", () => {
  describe("loading state", () => {
    it("shows loading text while fetching", () => {
      // Never-resolving promise keeps component in loading state
      mockApiGet.mockReturnValue(new Promise(() => {}));

      render(<RecentContent />);

      expect(screen.getByText("Loading content...")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Recent Content" }),
      ).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("renders section heading 'Recent Content'", async () => {
      mockApiGet.mockResolvedValue({
        items: [makeMockFeedItem()],
        nextCursor: null,
      });

      render(<RecentContent />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 2, name: "Recent Content" }),
        ).toBeInTheDocument();
      });
    });

    it("renders content cards from fetched data", async () => {
      const items = [
        makeMockFeedItem({ id: "c1", title: "First Post" }),
        makeMockFeedItem({ id: "c2", title: "Second Post" }),
        makeMockFeedItem({ id: "c3", title: "Third Post" }),
      ];
      mockApiGet.mockResolvedValue({ items, nextCursor: null });

      render(<RecentContent />);

      await waitFor(() => {
        expect(screen.getByText("First Post")).toBeInTheDocument();
      });
      expect(screen.getByText("Second Post")).toBeInTheDocument();
      expect(screen.getByText("Third Post")).toBeInTheDocument();
    });

    it("calls apiGet with correct endpoint and limit", async () => {
      mockApiGet.mockResolvedValue({
        items: [makeMockFeedItem()],
        nextCursor: null,
      });

      render(<RecentContent />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith("/api/content", { limit: 6 });
      });
    });

    it("renders 'View all content' link with href to /feed", async () => {
      mockApiGet.mockResolvedValue({
        items: [makeMockFeedItem()],
        nextCursor: null,
      });

      render(<RecentContent />);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /view all content/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/feed");
      });
    });
  });

  describe("error and empty states", () => {
    it("shows empty message when API returns empty items array", async () => {
      mockApiGet.mockResolvedValue({ items: [], nextCursor: null });

      const { getByText } = render(<RecentContent />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalled();
      });

      expect(getByText(/No content yet/)).toBeTruthy();
    });

    it("returns null on fetch error", async () => {
      mockApiGet.mockRejectedValue(new Error("Network error"));

      const { container } = render(<RecentContent />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalled();
      });

      // Component returns null — nothing rendered
      expect(container.innerHTML).toBe("");
    });
  });
});
