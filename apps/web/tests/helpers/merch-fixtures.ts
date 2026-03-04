import type { MerchProduct, MerchProductDetail } from "@snc/shared";

// ── Web-level Fixtures (API response shapes consumed by frontend components) ──

export const makeMockMerchProduct = (
  overrides?: Partial<MerchProduct>,
): MerchProduct => ({
  handle: "test-tshirt",
  title: "Test T-Shirt",
  price: 2500,
  image: {
    url: "https://cdn.shopify.com/s/files/test.jpg",
    altText: "Test T-Shirt",
  },
  creatorName: "Test Creator",
  creatorId: "user_test123",
  ...overrides,
});

export const makeMockMerchProductDetail = (
  overrides?: Partial<MerchProductDetail>,
): MerchProductDetail => ({
  handle: "test-tshirt",
  title: "Test T-Shirt",
  description: "A high-quality test t-shirt.",
  price: 2500,
  image: {
    url: "https://cdn.shopify.com/s/files/test.jpg",
    altText: "Test T-Shirt",
  },
  images: [
    {
      url: "https://cdn.shopify.com/s/files/test.jpg",
      altText: "Test T-Shirt",
    },
    {
      url: "https://cdn.shopify.com/s/files/test-back.jpg",
      altText: "Test T-Shirt back",
    },
  ],
  variants: [
    {
      id: "gid://shopify/ProductVariant/1001",
      title: "S / Black",
      price: 2500,
      available: true,
    },
    {
      id: "gid://shopify/ProductVariant/1002",
      title: "M / Black",
      price: 2500,
      available: false,
    },
    {
      id: "gid://shopify/ProductVariant/1003",
      title: "L / Black",
      price: 2500,
      available: true,
    },
  ],
  creatorName: "Test Creator",
  creatorId: "user_test123",
  ...overrides,
});
