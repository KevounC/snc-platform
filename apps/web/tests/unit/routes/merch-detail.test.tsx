import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { makeMockMerchProductDetail } from "../../helpers/merch-fixtures.js";

// ── Hoisted Mocks ──

const { mockUseLoaderData, mockProductDetail } = vi.hoisted(() => ({
  mockUseLoaderData: vi.fn(),
  mockProductDetail: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    createFileRoute: () => (options: Record<string, unknown>) => ({
      ...options,
      useLoaderData: mockUseLoaderData,
    }),
    Link: ({
      to,
      params,
      children,
      className,
    }: Record<string, unknown>) =>
      React.createElement(
        "a",
        {
          href:
            typeof params === "object" && params !== null
              ? (to as string).replace(
                  /\$(\w+)/g,
                  (_, key: string) =>
                    (params as Record<string, string>)[key] ?? "",
                )
              : (to as string),
          className,
        },
        children as React.ReactNode,
      ),
  };
});

vi.mock("../../../src/components/merch/product-detail.js", () => ({
  ProductDetail: (props: Record<string, unknown>) => {
    mockProductDetail(props);
    const product = props.product as { title: string; handle: string };
    return <div data-testid="product-detail">{product.title}</div>;
  },
}));

// ── Component Under Test ──

let MerchDetailPage: () => React.ReactElement;

beforeAll(async () => {
  const mod = await import("../../../src/routes/merch/$handle.js");
  MerchDetailPage = (
    mod.Route as unknown as { component: () => React.ReactElement }
  ).component;
});

// ── Test Lifecycle ──

beforeEach(() => {
  const mockProduct = makeMockMerchProductDetail();
  mockUseLoaderData.mockReturnValue(mockProduct);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──

describe("MerchDetailPage", () => {
  it("renders ProductDetail component with loader data", () => {
    render(<MerchDetailPage />);

    expect(screen.getByTestId("product-detail")).toBeInTheDocument();
    expect(mockProductDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({ handle: "test-tshirt" }),
      }),
    );
  });

  it("displays product title from loader data", () => {
    render(<MerchDetailPage />);

    expect(screen.getByText("Test T-Shirt")).toBeInTheDocument();
  });

  it("passes full product detail object to ProductDetail", () => {
    const product = makeMockMerchProductDetail({
      title: "Custom Product",
      handle: "custom-handle",
    });
    mockUseLoaderData.mockReturnValue(product);

    render(<MerchDetailPage />);

    expect(mockProductDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        product: expect.objectContaining({
          title: "Custom Product",
          handle: "custom-handle",
          description: expect.any(String),
          variants: expect.any(Array),
          images: expect.any(Array),
        }),
      }),
    );
  });
});
