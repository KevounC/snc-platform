import type {
  CreatorProfileResponse,
  UpdateCreatorProfile,
} from "@snc/shared";

import { apiGet, apiMutate } from "./fetch-utils.js";

/**
 * Fetch a single creator profile by user ID.
 */
export async function fetchCreatorProfile(
  creatorId: string,
): Promise<CreatorProfileResponse> {
  return apiGet<CreatorProfileResponse>(
    `/api/creators/${encodeURIComponent(creatorId)}`,
  );
}

/**
 * Update a creator's profile (owner only).
 * Returns the updated profile.
 */
export async function updateCreatorProfile(
  creatorId: string,
  data: UpdateCreatorProfile,
): Promise<CreatorProfileResponse> {
  return apiMutate<CreatorProfileResponse>(
    `/api/creators/${encodeURIComponent(creatorId)}`,
    { method: "PATCH", body: data },
  );
}
