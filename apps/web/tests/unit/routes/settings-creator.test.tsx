import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";

import {
  makeMockCreatorProfileResponse,
  MOCK_BANDCAMP_EMBED_URL,
} from "../../helpers/creator-fixtures.js";

// ── Hoisted Mocks ──

const {
  mockFetchAuthState,
  mockFetchCreatorProfile,
  mockUpdateCreatorProfile,
  mockRedirect,
} = vi.hoisted(() => ({
  mockFetchAuthState: vi.fn(),
  mockFetchCreatorProfile: vi.fn(),
  mockUpdateCreatorProfile: vi.fn(),
  mockRedirect: vi.fn((args: unknown) => args),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    createFileRoute: () => (options: Record<string, unknown>) => ({
      ...options,
    }),
    redirect: mockRedirect,
    Link: ({
      to,
      children,
      className,
    }: Record<string, unknown>) =>
      React.createElement(
        "a",
        { href: to as string, className },
        children as React.ReactNode,
      ),
  };
});

vi.mock("../../../src/lib/auth.js", () => ({
  fetchAuthState: mockFetchAuthState,
}));

vi.mock("../../../src/lib/creator.js", () => ({
  fetchCreatorProfile: mockFetchCreatorProfile,
  updateCreatorProfile: mockUpdateCreatorProfile,
}));

// ── Component Under Test ──

let CreatorSettingsPage: () => React.ReactElement;
let routeOptions: {
  beforeLoad: () => Promise<{ userId: string }>;
};

beforeAll(async () => {
  const mod = await import(
    "../../../src/routes/settings/creator.js"
  );
  const route = mod.Route as unknown as {
    component: () => React.ReactElement;
    beforeLoad: () => Promise<{ userId: string }>;
  };
  CreatorSettingsPage = route.component;
  routeOptions = { beforeLoad: route.beforeLoad };
});

// ── Default Test Data ──

const DEFAULT_PROFILE = makeMockCreatorProfileResponse({
  userId: "user_test123",
  bandcampUrl: "https://testband.bandcamp.com",
  bandcampEmbeds: [MOCK_BANDCAMP_EMBED_URL],
});

// ── Lifecycle ──

beforeEach(() => {
  mockFetchAuthState.mockResolvedValue({
    user: { id: "user_test123" },
    roles: ["creator"],
  });
  mockFetchCreatorProfile.mockResolvedValue(DEFAULT_PROFILE);
  mockUpdateCreatorProfile.mockResolvedValue(DEFAULT_PROFILE);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("CreatorSettingsPage", () => {
  // ── beforeLoad guard tests ──

  describe("beforeLoad", () => {
    it("redirects to /login when not authenticated", async () => {
      mockFetchAuthState.mockResolvedValue({ user: null, roles: [] });
      await expect(routeOptions.beforeLoad()).rejects.toEqual({ to: "/login" });
    });

    it("redirects to /feed when user is not a creator", async () => {
      mockFetchAuthState.mockResolvedValue({
        user: { id: "u1" },
        roles: ["subscriber"],
      });
      await expect(routeOptions.beforeLoad()).rejects.toEqual({ to: "/feed" });
    });

    it("returns userId when user is an authenticated creator", async () => {
      mockFetchAuthState.mockResolvedValue({
        user: { id: "u1" },
        roles: ["creator"],
      });
      const result = await routeOptions.beforeLoad();
      expect(result).toEqual({ userId: "u1" });
    });
  });

  // ── Rendering tests ──

  it("renders page heading 'Creator Settings'", async () => {
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });
  });

  it("renders Bandcamp URL input prefilled from profile", async () => {
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByDisplayValue("https://testband.bandcamp.com"),
      ).toBeInTheDocument();
    });
  });

  it("renders existing embed URLs in list", async () => {
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText(MOCK_BANDCAMP_EMBED_URL)).toBeInTheDocument();
    });
  });

  // ── URL validation tests ──

  it("shows validation error for invalid Bandcamp URL on blur", async () => {
    const user = userEvent.setup();
    mockFetchCreatorProfile.mockResolvedValue(
      makeMockCreatorProfileResponse({ bandcampUrl: null, bandcampEmbeds: [] }),
    );
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    const urlInput = screen.getByLabelText("Bandcamp Profile URL");
    await user.clear(urlInput);
    await user.type(urlInput, "https://example.com");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("Must be a valid bandcamp.com URL"),
      ).toBeInTheDocument();
    });
  });

  it("accepts empty Bandcamp URL (clear operation)", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    const urlInput = screen.getByLabelText("Bandcamp Profile URL");
    await user.clear(urlInput);
    await user.tab();

    expect(
      screen.queryByText("Must be a valid bandcamp.com URL"),
    ).not.toBeInTheDocument();
  });

  // ── Embed add/remove tests ──

  it("shows validation error for invalid embed URL on Add", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    const embedInput = screen.getByLabelText("Embedded Players");
    await user.type(embedInput, "https://example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.getByText("Must be a valid Bandcamp embed URL"),
    ).toBeInTheDocument();
  });

  it("adds a valid embed URL to the list", async () => {
    const user = userEvent.setup();
    const newEmbedUrl =
      "https://bandcamp.com/EmbeddedPlayer/album=999999999/size=large";
    mockFetchCreatorProfile.mockResolvedValue(
      makeMockCreatorProfileResponse({ bandcampEmbeds: [] }),
    );
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    const embedInput = screen.getByLabelText("Embedded Players");
    await user.type(embedInput, newEmbedUrl);
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText(newEmbedUrl)).toBeInTheDocument();
  });

  it("clears embed input after successful add", async () => {
    const user = userEvent.setup();
    const newEmbedUrl =
      "https://bandcamp.com/EmbeddedPlayer/album=999999999/size=large";
    mockFetchCreatorProfile.mockResolvedValue(
      makeMockCreatorProfileResponse({ bandcampEmbeds: [] }),
    );
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    const embedInput = screen.getByLabelText("Embedded Players");
    await user.type(embedInput, newEmbedUrl);
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(embedInput).toHaveValue("");
  });

  it("prevents duplicate embed URLs", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText(MOCK_BANDCAMP_EMBED_URL)).toBeInTheDocument();
    });

    const embedInput = screen.getByLabelText("Embedded Players");
    await user.type(embedInput, MOCK_BANDCAMP_EMBED_URL);
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.getByText("This embed URL has already been added"),
    ).toBeInTheDocument();
  });

  it("removes an embed from the list", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText(MOCK_BANDCAMP_EMBED_URL)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: `Remove ${MOCK_BANDCAMP_EMBED_URL}` }),
    );

    expect(
      screen.queryByText(MOCK_BANDCAMP_EMBED_URL),
    ).not.toBeInTheDocument();
  });

  it("disables Add button when embed list reaches 10", async () => {
    mockFetchCreatorProfile.mockResolvedValue(
      makeMockCreatorProfileResponse({
        bandcampEmbeds: Array.from(
          { length: 10 },
          (_, i) =>
            `https://bandcamp.com/EmbeddedPlayer/album=${i + 1}/size=large`,
        ),
      }),
    );
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  // ── Save tests ──

  it("submits PATCH request with updated Bandcamp fields", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateCreatorProfile).toHaveBeenCalledWith("user_test123", {
        bandcampUrl: "https://testband.bandcamp.com",
        bandcampEmbeds: [MOCK_BANDCAMP_EMBED_URL],
      });
    });
  });

  it("shows success message after save", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(
        screen.getByText("Changes saved successfully"),
      ).toBeInTheDocument();
    });
  });

  it("shows error message on save failure", async () => {
    const user = userEvent.setup();
    mockUpdateCreatorProfile.mockRejectedValue(
      new Error("Validation failed"),
    );
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Validation failed");
    });
  });

  it("disables form while submission is in progress", async () => {
    const user = userEvent.setup();
    mockUpdateCreatorProfile.mockReturnValue(new Promise(() => {}));
    render(<CreatorSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Creator Settings" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      screen.getByRole("button", { name: "Saving\u2026" }),
    ).toBeDisabled();
  });
});
