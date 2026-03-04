import type React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { FeedItem } from "@snc/shared";

import { ContentDetail } from "../../components/content/content-detail.js";
import { API_BASE_URL } from "../../lib/config.js";

// ── Route ──

export const Route = createFileRoute("/content/$contentId")({
  loader: async ({ params }): Promise<FeedItem> => {
    const res = await fetch(
      `${API_BASE_URL}/api/content/${params.contentId}`,
    );
    if (!res.ok) {
      throw new Error("Content not found");
    }
    return (await res.json()) as FeedItem;
  },
  component: ContentDetailPage,
});

// ── Component ──

function ContentDetailPage(): React.ReactElement {
  const item = Route.useLoaderData();
  return <ContentDetail item={item} />;
}
