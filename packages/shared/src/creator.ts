import { z } from "zod";

// ── Public Constants ──

export const BANDCAMP_URL_REGEX =
  /^https?:\/\/[a-zA-Z0-9-]+\.bandcamp\.com(\/.*)?$/;

export const BANDCAMP_EMBED_REGEX =
  /^https:\/\/bandcamp\.com\/EmbeddedPlayer\/.+$/;

// ── Public Schemas ──

export const UpdateCreatorProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  bandcampUrl: z
    .union([
      z.string().regex(BANDCAMP_URL_REGEX, "Must be a valid bandcamp.com URL"),
      z.literal(""),
    ])
    .optional(),
  bandcampEmbeds: z
    .array(
      z
        .string()
        .regex(BANDCAMP_EMBED_REGEX, "Must be a valid Bandcamp embed URL"),
    )
    .max(10, "Maximum 10 embeds allowed")
    .optional(),
});

export const CreatorProfileResponseSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  bandcampUrl: z.string().nullable(),
  bandcampEmbeds: z.array(z.string()),
  contentCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreatorListItemSchema = CreatorProfileResponseSchema;

export const CreatorListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(24),
  cursor: z.string().optional(),
});

export const CreatorListResponseSchema = z.object({
  items: z.array(CreatorListItemSchema),
  nextCursor: z.string().nullable(),
});

// ── Public Types ──

export type UpdateCreatorProfile = z.infer<typeof UpdateCreatorProfileSchema>;
export type CreatorProfileResponse = z.infer<
  typeof CreatorProfileResponseSchema
>;
export type CreatorListItem = z.infer<typeof CreatorListItemSchema>;
export type CreatorListQuery = z.infer<typeof CreatorListQuerySchema>;
export type CreatorListResponse = z.infer<typeof CreatorListResponseSchema>;
