import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  makeMockSessionResult,
  makeLoggedInSessionResult,
} from "../../../helpers/auth-fixtures.js";
import { makeMockPlan, makeMockUserSubscription } from "../../../helpers/subscription-fixtures.js";

// ── Hoisted Mocks ──

const {
  mockUseSession,
  mockNavigate,
  mockFetchPlans,
  mockCreateCheckout,
  mockFetchMySubscriptions,
} = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockNavigate: vi.fn(),
  mockFetchPlans: vi.fn(),
  mockCreateCheckout: vi.fn(),
  mockFetchMySubscriptions: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    Link: ({ to, children, className }: Record<string, unknown>) =>
      React.createElement(
        "a",
        { href: to as string, className },
        children as React.ReactNode,
      ),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../../src/lib/auth.js", () => ({
  useSession: mockUseSession,
}));

vi.mock("../../../../src/lib/subscription.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../src/lib/subscription.js")>();
  return {
    ...actual,
    fetchPlans: mockFetchPlans,
    createCheckout: mockCreateCheckout,
    fetchMySubscriptions: mockFetchMySubscriptions,
  };
});

vi.mock("../../../../src/components/subscription/plan-card.js", async () => {
  const React = await import("react");
  return {
    PlanCard: ({
      plan,
      onSubscribe,
    }: {
      plan: { id: string; name: string };
      onSubscribe: (id: string) => void;
    }) =>
      React.createElement(
        "div",
        { "data-testid": `plan-card-${plan.id}` },
        React.createElement("span", null, plan.name),
        React.createElement(
          "button",
          { onClick: () => onSubscribe(plan.id) },
          "Subscribe",
        ),
      ),
  };
});

// ── Import component under test (after mocks) ──

import { LandingPricing } from "../../../../src/components/landing/landing-pricing.js";

// ── Test Lifecycle ──

beforeEach(() => {
  mockUseSession.mockReturnValue(makeMockSessionResult());
  mockFetchPlans.mockResolvedValue([makeMockPlan({ id: "plan-platform-monthly" })]);
  mockFetchMySubscriptions.mockResolvedValue([]);
  mockCreateCheckout.mockResolvedValue("https://checkout.stripe.com/test");
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("LandingPricing", () => {
  describe("loading state", () => {
    it("shows loading text while fetching plans", () => {
      // Never-resolving promise keeps component in loading state
      mockFetchPlans.mockReturnValue(new Promise(() => {}));

      render(<LandingPricing />);

      expect(screen.getByText("Loading plans...")).toBeInTheDocument();
    });

    it("renders section heading during load", () => {
      mockFetchPlans.mockReturnValue(new Promise(() => {}));

      render(<LandingPricing />);

      expect(
        screen.getByRole("heading", { level: 2, name: "Get Access to Everything" }),
      ).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("renders section heading 'Get Access to Everything'", async () => {
      render(<LandingPricing />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 2, name: "Get Access to Everything" }),
        ).toBeInTheDocument();
      });
    });

    it("renders subheading text", async () => {
      render(<LandingPricing />);

      await waitFor(() => {
        expect(
          screen.getByText(/Subscribe to the platform and access all content/),
        ).toBeInTheDocument();
      });
    });

    it("renders PlanCard for each platform plan", async () => {
      mockFetchPlans.mockResolvedValue([
        makeMockPlan({ id: "plan-platform-monthly", name: "S/NC All Access" }),
      ]);

      render(<LandingPricing />);

      await waitFor(() => {
        expect(screen.getByTestId("plan-card-plan-platform-monthly")).toBeInTheDocument();
        expect(screen.getByText("S/NC All Access")).toBeInTheDocument();
      });
    });

    it("calls fetchPlans with { type: 'platform' } on mount", async () => {
      render(<LandingPricing />);

      await waitFor(() => {
        expect(mockFetchPlans).toHaveBeenCalledWith({ type: "platform" });
      });
    });

    it("renders 'Learn more about pricing' link with href to /pricing", async () => {
      render(<LandingPricing />);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /learn more about pricing/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/pricing");
      });
    });
  });

  describe("subscribed state", () => {
    it("shows 'You're subscribed!' message when user has active platform subscription", async () => {
      mockUseSession.mockReturnValue(makeLoggedInSessionResult());
      mockFetchMySubscriptions.mockResolvedValue([
        makeMockUserSubscription({ status: "active" }),
      ]);

      render(<LandingPricing />);

      await waitFor(() => {
        expect(screen.getByText("You're subscribed!")).toBeInTheDocument();
      });
    });

    it("shows link to /feed in subscribed state", async () => {
      mockUseSession.mockReturnValue(makeLoggedInSessionResult());
      mockFetchMySubscriptions.mockResolvedValue([
        makeMockUserSubscription({ status: "active" }),
      ]);

      render(<LandingPricing />);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: "Explore content" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/feed");
      });
    });

    it("fetches subscriptions when session data exists", async () => {
      mockUseSession.mockReturnValue(makeLoggedInSessionResult());

      render(<LandingPricing />);

      await waitFor(() => {
        expect(mockFetchMySubscriptions).toHaveBeenCalled();
      });
    });
  });

  describe("subscribe flow", () => {
    it("calls handleSubscribe → navigate to /login when unauthenticated", async () => {
      const user = userEvent.setup();
      mockUseSession.mockReturnValue(makeMockSessionResult());

      render(<LandingPricing />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
      });
    });

    it("calls createCheckout with plan ID when authenticated", async () => {
      const user = userEvent.setup();
      mockUseSession.mockReturnValue(makeLoggedInSessionResult());
      mockFetchMySubscriptions.mockResolvedValue([]);
      vi.stubGlobal("location", { ...window.location, set href(_: string) {} });

      render(<LandingPricing />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(mockCreateCheckout).toHaveBeenCalledWith("plan-platform-monthly");
      });
    });
  });

  describe("error and empty states", () => {
    it("shows empty message when no plans available (empty array)", async () => {
      mockFetchPlans.mockResolvedValue([]);

      const { getByText } = render(<LandingPricing />);

      await waitFor(() => {
        expect(mockFetchPlans).toHaveBeenCalled();
      });

      expect(getByText(/Plans coming soon/)).toBeTruthy();
    });

    it("returns null on fetch error", async () => {
      mockFetchPlans.mockRejectedValue(new Error("Network error"));

      const { container } = render(<LandingPricing />);

      await waitFor(() => {
        expect(mockFetchPlans).toHaveBeenCalled();
      });

      expect(container.innerHTML).toBe("");
    });
  });
});
