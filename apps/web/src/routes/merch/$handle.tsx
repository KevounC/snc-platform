import type React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { MerchProductDetail } from "@snc/shared";

import { ProductDetail } from "../../components/merch/product-detail.js";
import { API_BASE_URL } from "../../lib/config.js";

// ── Route ──

export const Route = createFileRoute("/merch/$handle")({
  loader: async ({ params }): Promise<MerchProductDetail> => {
    const res = await fetch(
      `${API_BASE_URL}/api/merch/${encodeURIComponent(params.handle)}`,
    );
    if (!res.ok) {
      throw new Error("Product not found");
    }
    return (await res.json()) as MerchProductDetail;
  },
  component: MerchDetailPage,
});

// ── Component ──

function MerchDetailPage(): React.ReactElement {
  const product = Route.useLoaderData();
  return <ProductDetail product={product} />;
}
