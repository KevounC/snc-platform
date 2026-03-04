import { AppError, ok, err, type Result, CREATOR_TAG_PREFIX } from "@snc/shared";

import { config } from "../config.js";
import { wrapExternalError } from "./external-error.js";

// ── Public Types ──

export type ShopifyImage = {
  url: string;
  altText: string | null;
};

export type ShopifyVariantNode = {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
};

export type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  tags: string[];
  featuredImage: ShopifyImage | null;
  images: { edges: Array<{ node: ShopifyImage }> };
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  variants: { edges: Array<{ node: ShopifyVariantNode }> };
};

export type ShopifyPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type GetProductsParams = {
  first?: number;
  after?: string;
  creatorId?: string;
};

export type GetProductsResult = {
  products: ShopifyProductNode[];
  pageInfo: ShopifyPageInfo;
};

export type CreateCheckoutParams = {
  variantId: string;
  quantity: number;
  returnUrl: string;
};

// ── Module-Level Configuration ──

const STOREFRONT_API_VERSION = "2025-01";

const SHOPIFY_STOREFRONT_ENDPOINT: string | null =
  config.SHOPIFY_STORE_DOMAIN !== undefined
    ? `https://${config.SHOPIFY_STORE_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`
    : null;

const STOREFRONT_TOKEN: string | null =
  config.SHOPIFY_STOREFRONT_TOKEN ?? null;

// ── Private Helpers ──

const wrapShopifyError = wrapExternalError("SHOPIFY_ERROR");

const ensureConfigured = (): Result<void, AppError> => {
  if (SHOPIFY_STOREFRONT_ENDPOINT === null || STOREFRONT_TOKEN === null) {
    return err(
      new AppError(
        "MERCH_NOT_CONFIGURED",
        "Shopify integration is not configured",
        503,
      ),
    );
  }
  return ok(undefined);
};

type GraphQLResponse<T> = {
  data: T;
  errors?: Array<{ message: string }>;
};

const query = async <T>(
  graphqlQuery: string,
  variables?: Record<string, unknown>,
): Promise<Result<T, AppError>> => {
  const configured = ensureConfigured();
  if (!configured.ok) return configured as Result<T, AppError>;

  try {
    const response = await fetch(SHOPIFY_STOREFRONT_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN!,
      },
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    if (!response.ok) {
      return err(
        new AppError(
          "SHOPIFY_ERROR",
          `Shopify API returned ${response.status}`,
          502,
        ),
      );
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors !== undefined && json.errors.length > 0) {
      return err(
        new AppError(
          "SHOPIFY_ERROR",
          json.errors.map((e) => e.message).join("; "),
          502,
        ),
      );
    }

    return ok(json.data);
  } catch (e) {
    return err(wrapShopifyError(e));
  }
};

// ── GraphQL Queries ──

const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          id
          handle
          title
          description
          vendor
          tags
          featuredImage {
            url
            altText
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      description
      vendor
      tags
      featuredImage {
        url
        altText
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ── Private Response Types (for GraphQL data extraction) ──

type ProductsQueryData = {
  products: {
    edges: Array<{ cursor: string; node: ShopifyProductNode }>;
    pageInfo: ShopifyPageInfo;
  };
};

type ProductByHandleData = {
  productByHandle: ShopifyProductNode | null;
};

type CartCreateData = {
  cartCreate: {
    cart: { checkoutUrl: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
};

// ── Public API ──

export const getProducts = async (
  params?: GetProductsParams,
): Promise<Result<GetProductsResult, AppError>> => {
  const first = params?.first ?? 12;
  const after = params?.after;
  const creatorId = params?.creatorId;

  const variables: Record<string, unknown> = { first };
  if (after !== undefined) variables["after"] = after;
  if (creatorId !== undefined) {
    variables["query"] = `tag:${CREATOR_TAG_PREFIX}${creatorId}`;
  }

  const result = await query<ProductsQueryData>(PRODUCTS_QUERY, variables);
  if (!result.ok) return result;

  const products = result.value.products.edges.map((e) => e.node);
  const pageInfo = result.value.products.pageInfo;

  return ok({ products, pageInfo });
};

export const getProductByHandle = async (
  handle: string,
): Promise<Result<ShopifyProductNode | null, AppError>> => {
  const result = await query<ProductByHandleData>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });
  if (!result.ok) return result;

  return ok(result.value.productByHandle);
};

export const createCheckoutUrl = async (
  params: CreateCheckoutParams,
): Promise<Result<string, AppError>> => {
  const input = {
    lines: [{ merchandiseId: params.variantId, quantity: params.quantity }],
  };

  const result = await query<CartCreateData>(CART_CREATE_MUTATION, { input });
  if (!result.ok) return result;

  const { cart, userErrors } = result.value.cartCreate;

  if (userErrors.length > 0) {
    return err(
      new AppError(
        "SHOPIFY_ERROR",
        userErrors[0]?.message ?? "Cart creation failed",
        502,
      ),
    );
  }

  if (cart === null) {
    return err(
      new AppError("SHOPIFY_ERROR", "Cart creation returned null", 502),
    );
  }

  return ok(cart.checkoutUrl);
};
