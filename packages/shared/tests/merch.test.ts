import { describe, it, expect } from "vitest";

import {
  CREATOR_TAG_PREFIX,
  MerchImageSchema,
  MerchVariantSchema,
  MerchProductSchema,
  MerchProductDetailSchema,
  MerchListQuerySchema,
  MerchListResponseSchema,
  MerchCheckoutRequestSchema,
  MerchCheckoutResponseSchema,
  type MerchImage,
  type MerchVariant,
  type MerchProduct,
  type MerchProductDetail,
  type MerchListQuery,
  type MerchListResponse,
  type MerchCheckoutRequest,
  type MerchCheckoutResponse,
} from "../src/index.js";

const VALID_IMAGE = {
  url: "https://cdn.shopify.com/s/files/test.jpg",
  altText: "Test image",
};

const VALID_VARIANT = {
  id: "gid://shopify/ProductVariant/1001",
  title: "M / Black",
  price: 2500,
  available: true,
};

const VALID_PRODUCT = {
  handle: "test-tshirt",
  title: "Test T-Shirt",
  price: 2500,
  image: VALID_IMAGE,
  creatorName: "Test Creator",
  creatorId: "user_test123",
};

const VALID_PRODUCT_DETAIL = {
  ...VALID_PRODUCT,
  description: "A high-quality test t-shirt.",
  images: [VALID_IMAGE],
  variants: [VALID_VARIANT],
};

describe("CREATOR_TAG_PREFIX", () => {
  it('equals "snc-creator:"', () => {
    expect(CREATOR_TAG_PREFIX).toBe("snc-creator:");
  });
});

describe("MerchImageSchema", () => {
  it("validates a complete image object", () => {
    const result = MerchImageSchema.parse(VALID_IMAGE);
    expect(result.url).toBe(VALID_IMAGE.url);
    expect(result.altText).toBe("Test image");
  });

  it("accepts null altText", () => {
    const result = MerchImageSchema.parse({ ...VALID_IMAGE, altText: null });
    expect(result.altText).toBeNull();
  });

  it("rejects invalid URL", () => {
    expect(() =>
      MerchImageSchema.parse({ url: "not-a-url", altText: null }),
    ).toThrow();
  });

  it("rejects missing url", () => {
    expect(() => MerchImageSchema.parse({ altText: null })).toThrow();
  });
});

describe("MerchVariantSchema", () => {
  it("validates a complete variant", () => {
    const result = MerchVariantSchema.parse(VALID_VARIANT);
    expect(result.id).toBe(VALID_VARIANT.id);
    expect(result.title).toBe("M / Black");
    expect(result.price).toBe(2500);
    expect(result.available).toBe(true);
  });

  it("accepts price of 0", () => {
    const result = MerchVariantSchema.parse({ ...VALID_VARIANT, price: 0 });
    expect(result.price).toBe(0);
  });

  it("rejects negative price", () => {
    expect(() =>
      MerchVariantSchema.parse({ ...VALID_VARIANT, price: -1 }),
    ).toThrow();
  });

  it("rejects non-integer price", () => {
    expect(() =>
      MerchVariantSchema.parse({ ...VALID_VARIANT, price: 25.99 }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => MerchVariantSchema.parse({})).toThrow();
  });
});

describe("MerchProductSchema", () => {
  it("validates a complete product object", () => {
    const result = MerchProductSchema.parse(VALID_PRODUCT);
    expect(result.handle).toBe("test-tshirt");
    expect(result.title).toBe("Test T-Shirt");
    expect(result.price).toBe(2500);
    expect(result.image).toStrictEqual(VALID_IMAGE);
    expect(result.creatorName).toBe("Test Creator");
    expect(result.creatorId).toBe("user_test123");
  });

  it("accepts null for image, creatorName, and creatorId", () => {
    const result = MerchProductSchema.parse({
      ...VALID_PRODUCT,
      image: null,
      creatorName: null,
      creatorId: null,
    });
    expect(result.image).toBeNull();
    expect(result.creatorName).toBeNull();
    expect(result.creatorId).toBeNull();
  });

  it("accepts price of 0", () => {
    const result = MerchProductSchema.parse({ ...VALID_PRODUCT, price: 0 });
    expect(result.price).toBe(0);
  });

  it("rejects negative price", () => {
    expect(() =>
      MerchProductSchema.parse({ ...VALID_PRODUCT, price: -1 }),
    ).toThrow();
  });

  it("rejects non-integer price", () => {
    expect(() =>
      MerchProductSchema.parse({ ...VALID_PRODUCT, price: 9.99 }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => MerchProductSchema.parse({})).toThrow();
  });
});

describe("MerchProductDetailSchema", () => {
  it("validates a product with variants and images", () => {
    const result = MerchProductDetailSchema.parse(VALID_PRODUCT_DETAIL);
    expect(result.handle).toBe("test-tshirt");
    expect(result.description).toBe("A high-quality test t-shirt.");
    expect(result.images).toHaveLength(1);
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]!.id).toBe(VALID_VARIANT.id);
  });

  it("accepts empty variants and images arrays", () => {
    const result = MerchProductDetailSchema.parse({
      ...VALID_PRODUCT_DETAIL,
      images: [],
      variants: [],
    });
    expect(result.images).toHaveLength(0);
    expect(result.variants).toHaveLength(0);
  });

  it("accepts multiple variants and images", () => {
    const image2 = { url: "https://cdn.shopify.com/s/files/back.jpg", altText: null };
    const variant2 = { ...VALID_VARIANT, id: "gid://shopify/ProductVariant/1002", title: "L / Black" };
    const result = MerchProductDetailSchema.parse({
      ...VALID_PRODUCT_DETAIL,
      images: [VALID_IMAGE, image2],
      variants: [VALID_VARIANT, variant2],
    });
    expect(result.images).toHaveLength(2);
    expect(result.variants).toHaveLength(2);
  });

  it("inherits all MerchProductSchema fields", () => {
    const result = MerchProductDetailSchema.parse(VALID_PRODUCT_DETAIL);
    expect(result.price).toBe(2500);
    expect(result.creatorName).toBe("Test Creator");
  });

  it("rejects missing description", () => {
    const { description, ...rest } = VALID_PRODUCT_DETAIL;
    expect(() => MerchProductDetailSchema.parse(rest)).toThrow();
  });

  it("rejects invalid items in variants array", () => {
    expect(() =>
      MerchProductDetailSchema.parse({
        ...VALID_PRODUCT_DETAIL,
        variants: [{ invalid: true }],
      }),
    ).toThrow();
  });
});

describe("MerchListQuerySchema", () => {
  it("parses empty object to defaults (limit = 12)", () => {
    const result = MerchListQuerySchema.parse({});
    expect(result).toStrictEqual({ limit: 12 });
  });

  it("coerces string limit to number", () => {
    const result = MerchListQuerySchema.parse({ limit: "20" });
    expect(result.limit).toBe(20);
  });

  it("accepts limit at minimum boundary (1)", () => {
    const result = MerchListQuerySchema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("accepts limit at maximum boundary (50)", () => {
    const result = MerchListQuerySchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it("rejects limit below minimum (0)", () => {
    expect(() => MerchListQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit above maximum (51)", () => {
    expect(() => MerchListQuerySchema.parse({ limit: 51 })).toThrow();
  });

  it("accepts optional creatorId", () => {
    const result = MerchListQuerySchema.parse({ creatorId: "user_123" });
    expect(result.creatorId).toBe("user_123");
  });

  it("accepts optional cursor", () => {
    const result = MerchListQuerySchema.parse({ cursor: "abc123" });
    expect(result.cursor).toBe("abc123");
  });

  it("accepts all fields combined", () => {
    const result = MerchListQuerySchema.parse({
      creatorId: "user_123",
      cursor: "abc",
      limit: 24,
    });
    expect(result.creatorId).toBe("user_123");
    expect(result.cursor).toBe("abc");
    expect(result.limit).toBe(24);
  });
});

describe("MerchListResponseSchema", () => {
  it("validates items array with nextCursor", () => {
    const result = MerchListResponseSchema.parse({
      items: [VALID_PRODUCT],
      nextCursor: "cursor_abc",
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("cursor_abc");
  });

  it("validates empty items with null nextCursor (last page)", () => {
    const result = MerchListResponseSchema.parse({
      items: [],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("validates multiple items", () => {
    const product2 = { ...VALID_PRODUCT, handle: "test-hoodie" };
    const result = MerchListResponseSchema.parse({
      items: [VALID_PRODUCT, product2],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(2);
  });

  it("rejects missing items field", () => {
    expect(() =>
      MerchListResponseSchema.parse({ nextCursor: null }),
    ).toThrow();
  });

  it("rejects invalid items in the array", () => {
    expect(() =>
      MerchListResponseSchema.parse({
        items: [{ invalid: true }],
        nextCursor: null,
      }),
    ).toThrow();
  });
});

describe("MerchCheckoutRequestSchema", () => {
  it("validates variantId and quantity", () => {
    const result = MerchCheckoutRequestSchema.parse({
      variantId: "gid://shopify/ProductVariant/1001",
      quantity: 2,
    });
    expect(result.variantId).toBe("gid://shopify/ProductVariant/1001");
    expect(result.quantity).toBe(2);
  });

  it("defaults quantity to 1 when omitted", () => {
    const result = MerchCheckoutRequestSchema.parse({
      variantId: "gid://shopify/ProductVariant/1001",
    });
    expect(result.quantity).toBe(1);
  });

  it("coerces string quantity to number", () => {
    const result = MerchCheckoutRequestSchema.parse({
      variantId: "gid://shopify/ProductVariant/1001",
      quantity: "3",
    });
    expect(result.quantity).toBe(3);
  });

  it("accepts quantity at maximum boundary (10)", () => {
    const result = MerchCheckoutRequestSchema.parse({
      variantId: "gid://shopify/ProductVariant/1001",
      quantity: 10,
    });
    expect(result.quantity).toBe(10);
  });

  it("rejects empty variantId", () => {
    expect(() =>
      MerchCheckoutRequestSchema.parse({ variantId: "" }),
    ).toThrow();
  });

  it("rejects missing variantId", () => {
    expect(() =>
      MerchCheckoutRequestSchema.parse({ quantity: 1 }),
    ).toThrow();
  });

  it("rejects quantity above maximum (11)", () => {
    expect(() =>
      MerchCheckoutRequestSchema.parse({
        variantId: "gid://shopify/ProductVariant/1001",
        quantity: 11,
      }),
    ).toThrow();
  });

  it("rejects quantity below minimum (0)", () => {
    expect(() =>
      MerchCheckoutRequestSchema.parse({
        variantId: "gid://shopify/ProductVariant/1001",
        quantity: 0,
      }),
    ).toThrow();
  });

  it("rejects non-integer quantity", () => {
    expect(() =>
      MerchCheckoutRequestSchema.parse({
        variantId: "gid://shopify/ProductVariant/1001",
        quantity: 1.5,
      }),
    ).toThrow();
  });
});

describe("MerchCheckoutResponseSchema", () => {
  it("validates a valid checkout URL", () => {
    const result = MerchCheckoutResponseSchema.parse({
      checkoutUrl: "https://test-store.myshopify.com/cart/c/mock",
    });
    expect(result.checkoutUrl).toBe(
      "https://test-store.myshopify.com/cart/c/mock",
    );
  });

  it("rejects non-URL string", () => {
    expect(() =>
      MerchCheckoutResponseSchema.parse({ checkoutUrl: "not-a-url" }),
    ).toThrow();
  });

  it("rejects missing checkoutUrl", () => {
    expect(() => MerchCheckoutResponseSchema.parse({})).toThrow();
  });
});

// ── Type-level assertions (compile-time only) ──

const _imageCheck: MerchImage = VALID_IMAGE;
const _variantCheck: MerchVariant = VALID_VARIANT;
const _productCheck: MerchProduct = VALID_PRODUCT;
const _detailCheck: MerchProductDetail = VALID_PRODUCT_DETAIL;
const _queryCheck: MerchListQuery = { limit: 12 };
const _responseCheck: MerchListResponse = { items: [], nextCursor: null };
const _checkoutReqCheck: MerchCheckoutRequest = {
  variantId: "gid://shopify/ProductVariant/1001",
  quantity: 1,
};
const _checkoutResCheck: MerchCheckoutResponse = {
  checkoutUrl: "https://test-store.myshopify.com/cart/c/mock",
};
