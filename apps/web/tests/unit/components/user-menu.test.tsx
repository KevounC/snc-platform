import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  makeMockSessionResult,
  makeLoggedInSessionResult,
} from "../../helpers/auth-fixtures.js";

// ── Hoisted Mocks ──

const {
  mockNavigate,
  mockUseSession,
  mockUseRoles,
  mockSignOut,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseSession: vi.fn(),
  mockUseRoles: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    Link: ({
      to,
      children,
      className,
      onClick,
      role,
    }: Record<string, unknown>) =>
      React.createElement(
        "a",
        { href: to as string, className, onClick, role },
        children as React.ReactNode,
      ),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../src/lib/auth.js", () => ({
  useSession: mockUseSession,
  useRoles: mockUseRoles,
  hasRole: (roles: string[], role: string) => roles.includes(role),
}));

vi.mock("../../../src/lib/auth-client.js", () => ({
  authClient: { signOut: mockSignOut },
}));

// ── Import component under test (after mocks) ──

import { UserMenu } from "../../../src/components/layout/user-menu.js";

// ── Test Lifecycle ──

beforeEach(() => {
  mockUseSession.mockReturnValue(makeMockSessionResult());
  mockUseRoles.mockReturnValue([]);
  mockSignOut.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("UserMenu", () => {
  it("shows login and signup links when not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    });

    render(<UserMenu />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("shows user avatar when authenticated", () => {
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );

    render(<UserMenu />);

    const button = screen.getByRole("button", { name: "User menu" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("JD");
  });

  it("toggles dropdown menu on avatar click", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );

    render(<UserMenu />);

    expect(screen.queryByRole("menu")).toBeNull();

    await user.click(screen.getByLabelText("User menu"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("shows 'Creator Settings' link for users with creator role", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );
    mockUseRoles.mockReturnValue(["creator"]);

    render(<UserMenu />);

    await user.click(screen.getByLabelText("User menu"));

    const creatorSettingsLink = screen.getByRole("menuitem", {
      name: "Creator Settings",
    });
    expect(creatorSettingsLink).toHaveAttribute("href", "/settings/creator");
  });

  it("hides 'Creator Settings' link for users without creator role", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );
    mockUseRoles.mockReturnValue(["subscriber"]);

    render(<UserMenu />);

    await user.click(screen.getByLabelText("User menu"));

    expect(
      screen.queryByRole("menuitem", { name: "Creator Settings" }),
    ).toBeNull();
  });

  it("shows 'Dashboard' link for cooperative-member role", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );
    mockUseRoles.mockReturnValue(["cooperative-member"]);

    render(<UserMenu />);

    await user.click(screen.getByLabelText("User menu"));

    const dashboardLink = screen.getByRole("menuitem", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  it("hides 'Dashboard' link for users without cooperative-member role", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );
    mockUseRoles.mockReturnValue(["subscriber"]);

    render(<UserMenu />);

    await user.click(screen.getByLabelText("User menu"));

    expect(
      screen.queryByRole("menuitem", { name: "Dashboard" }),
    ).toBeNull();
  });

  it("renders Settings, Subscriptions, and My Bookings links", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(
      makeLoggedInSessionResult({ name: "Jane Doe" }),
    );

    render(<UserMenu />);

    await user.click(screen.getByLabelText("User menu"));

    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(
      screen.getByRole("menuitem", { name: "Subscriptions" }),
    ).toHaveAttribute("href", "/settings/subscriptions");
    expect(
      screen.getByRole("menuitem", { name: "My Bookings" }),
    ).toHaveAttribute("href", "/settings/bookings");
  });

  it("returns null while session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });

    const { container } = render(<UserMenu />);

    expect(container.innerHTML).toBe("");
  });
});
