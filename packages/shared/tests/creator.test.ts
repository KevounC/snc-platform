import { describe, it, expect } from "vitest";

import {
  BANDCAMP_URL_REGEX,
  BANDCAMP_EMBED_REGEX,
  UpdateCreatorProfileSchema,
  CreatorProfileResponseSchema,
  CreatorListItemSchema,
  CreatorListQuerySchema,
  CreatorListResponseSchema,
  type UpdateCreatorProfile,
  type CreatorProfileResponse,
  type CreatorListItem,
  type CreatorListQuery,
  type CreatorListResponse,
} from "../src/index.js";

// ── Test Fixtures ──

const VALID_CREATOR_PROFILE = {
  userId: "user_creator1",
  displayName: "Test Creator",
  bio: "A test creator bio",
  avatarUrl: "/api/creators/user_creator1/avatar",
  bannerUrl: null,
  bandcampUrl: null,
  bandcampEmbeds: [],
  contentCount: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// ── Tests ──

describe("BANDCAMP_URL_REGEX", () => {
  it('matches "https://artist-name.bandcamp.com"', () => {
    expect(BANDCAMP_URL_REGEX.test("https://artist-name.bandcamp.com")).toBe(
      true,
    );
  });

  it('matches "http://artist.bandcamp.com/album/test"', () => {
    expect(
      BANDCAMP_URL_REGEX.test("http://artist.bandcamp.com/album/test"),
    ).toBe(true);
  });

  it('does not match "https://example.com"', () => {
    expect(BANDCAMP_URL_REGEX.test("https://example.com")).toBe(false);
  });

  it('does not match "https://bandcamp.com"', () => {
    expect(BANDCAMP_URL_REGEX.test("https://bandcamp.com")).toBe(false);
  });
});

describe("BANDCAMP_EMBED_REGEX", () => {
  it('matches "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/"', () => {
    expect(
      BANDCAMP_EMBED_REGEX.test(
        "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
      ),
    ).toBe(true);
  });

  it('matches "https://bandcamp.com/EmbeddedPlayer/track=456"', () => {
    expect(
      BANDCAMP_EMBED_REGEX.test(
        "https://bandcamp.com/EmbeddedPlayer/track=456",
      ),
    ).toBe(true);
  });

  it("matches a full embed URL with multiple parameters", () => {
    expect(
      BANDCAMP_EMBED_REGEX.test(
        "https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/bgcol=333333/linkcol=ffffff/tracklist=false/artwork=small/",
      ),
    ).toBe(true);
  });

  it('rejects non-Bandcamp domain "https://example.com/EmbeddedPlayer/album=123"', () => {
    expect(
      BANDCAMP_EMBED_REGEX.test(
        "https://example.com/EmbeddedPlayer/album=123",
      ),
    ).toBe(false);
  });

  it('rejects HTTP "http://bandcamp.com/EmbeddedPlayer/album=123"', () => {
    expect(
      BANDCAMP_EMBED_REGEX.test(
        "http://bandcamp.com/EmbeddedPlayer/album=123",
      ),
    ).toBe(false);
  });

  it('rejects trailing slash only "https://bandcamp.com/EmbeddedPlayer/"', () => {
    expect(
      BANDCAMP_EMBED_REGEX.test(
        "https://bandcamp.com/EmbeddedPlayer/",
      ),
    ).toBe(false);
  });

  it('rejects Bandcamp profile URL (not embed) "https://artist.bandcamp.com"', () => {
    expect(
      BANDCAMP_EMBED_REGEX.test("https://artist.bandcamp.com"),
    ).toBe(false);
  });
});

describe("UpdateCreatorProfileSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = UpdateCreatorProfileSchema.parse({});
    expect(result).toStrictEqual({});
  });

  it("accepts displayName only", () => {
    const result = UpdateCreatorProfileSchema.parse({
      displayName: "New Name",
    });
    expect(result.displayName).toBe("New Name");
  });

  it("accepts bio only", () => {
    const result = UpdateCreatorProfileSchema.parse({ bio: "A bio" });
    expect(result.bio).toBe("A bio");
  });

  it("accepts both displayName and bio", () => {
    const result = UpdateCreatorProfileSchema.parse({
      displayName: "New Name",
      bio: "A bio",
    });
    expect(result.displayName).toBe("New Name");
    expect(result.bio).toBe("A bio");
  });

  it("rejects empty displayName (min length 1)", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({ displayName: "" }),
    ).toThrow();
  });

  it("rejects displayName exceeding 100 characters", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({ displayName: "x".repeat(101) }),
    ).toThrow();
  });

  it("accepts displayName at exactly 100 characters", () => {
    const result = UpdateCreatorProfileSchema.parse({
      displayName: "x".repeat(100),
    });
    expect(result.displayName).toHaveLength(100);
  });

  it("rejects bio exceeding 2000 characters", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({ bio: "x".repeat(2001) }),
    ).toThrow();
  });

  it("accepts bio at exactly 2000 characters", () => {
    const result = UpdateCreatorProfileSchema.parse({
      bio: "x".repeat(2000),
    });
    expect(result.bio).toHaveLength(2000);
  });

  it("accepts bandcampUrl with a valid Bandcamp URL", () => {
    const result = UpdateCreatorProfileSchema.parse({
      bandcampUrl: "https://myband.bandcamp.com",
    });
    expect(result.bandcampUrl).toBe("https://myband.bandcamp.com");
  });

  it("accepts bandcampUrl with a Bandcamp URL containing a path", () => {
    const result = UpdateCreatorProfileSchema.parse({
      bandcampUrl: "https://myband.bandcamp.com/album/cool-album",
    });
    expect(result.bandcampUrl).toBe(
      "https://myband.bandcamp.com/album/cool-album",
    );
  });

  it('accepts bandcampUrl as empty string "" (clear operation)', () => {
    const result = UpdateCreatorProfileSchema.parse({
      bandcampUrl: "",
    });
    expect(result.bandcampUrl).toBe("");
  });

  it("rejects bandcampUrl with a non-Bandcamp domain", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({
        bandcampUrl: "https://example.com",
      }),
    ).toThrow();
  });

  it("rejects bandcampUrl with a plain string (not a URL)", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({
        bandcampUrl: "not a url",
      }),
    ).toThrow();
  });

  it("accepts bandcampEmbeds as an array of valid embed URLs", () => {
    const result = UpdateCreatorProfileSchema.parse({
      bandcampEmbeds: [
        "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
        "https://bandcamp.com/EmbeddedPlayer/track=456",
      ],
    });
    expect(result.bandcampEmbeds).toHaveLength(2);
  });

  it("accepts bandcampEmbeds as an empty array (clear embeds)", () => {
    const result = UpdateCreatorProfileSchema.parse({
      bandcampEmbeds: [],
    });
    expect(result.bandcampEmbeds).toHaveLength(0);
  });

  it("rejects bandcampEmbeds exceeding 10 items", () => {
    const embeds = Array.from(
      { length: 11 },
      (_, i) => `https://bandcamp.com/EmbeddedPlayer/album=${i}`,
    );
    expect(() =>
      UpdateCreatorProfileSchema.parse({ bandcampEmbeds: embeds }),
    ).toThrow();
  });

  it("accepts bandcampEmbeds at exactly 10 items", () => {
    const embeds = Array.from(
      { length: 10 },
      (_, i) => `https://bandcamp.com/EmbeddedPlayer/album=${i}`,
    );
    const result = UpdateCreatorProfileSchema.parse({
      bandcampEmbeds: embeds,
    });
    expect(result.bandcampEmbeds).toHaveLength(10);
  });

  it("rejects bandcampEmbeds containing invalid embed URLs", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({
        bandcampEmbeds: ["https://example.com/not-an-embed"],
      }),
    ).toThrow();
  });

  it("rejects bandcampEmbeds containing HTTP embed URLs", () => {
    expect(() =>
      UpdateCreatorProfileSchema.parse({
        bandcampEmbeds: ["http://bandcamp.com/EmbeddedPlayer/album=123"],
      }),
    ).toThrow();
  });

  it("accepts both bandcampUrl and bandcampEmbeds together", () => {
    const result = UpdateCreatorProfileSchema.parse({
      bandcampUrl: "https://myband.bandcamp.com",
      bandcampEmbeds: [
        "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
      ],
    });
    expect(result.bandcampUrl).toBe("https://myband.bandcamp.com");
    expect(result.bandcampEmbeds).toHaveLength(1);
  });

  it("accepts Bandcamp fields alongside displayName and bio", () => {
    const result = UpdateCreatorProfileSchema.parse({
      displayName: "My Band",
      bio: "We make music",
      bandcampUrl: "https://myband.bandcamp.com",
      bandcampEmbeds: [
        "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
      ],
    });
    expect(result.displayName).toBe("My Band");
    expect(result.bandcampUrl).toBe("https://myband.bandcamp.com");
  });
});

describe("CreatorProfileResponseSchema", () => {
  it("validates a complete profile response object", () => {
    const result = CreatorProfileResponseSchema.parse(VALID_CREATOR_PROFILE);
    expect(result.userId).toBe(VALID_CREATOR_PROFILE.userId);
    expect(result.displayName).toBe(VALID_CREATOR_PROFILE.displayName);
    expect(result.contentCount).toBe(5);
  });

  it("accepts null for all nullable fields", () => {
    const result = CreatorProfileResponseSchema.parse({
      ...VALID_CREATOR_PROFILE,
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      bandcampUrl: null,
    });
    expect(result.bio).toBeNull();
    expect(result.avatarUrl).toBeNull();
    expect(result.bannerUrl).toBeNull();
    expect(result.bandcampUrl).toBeNull();
  });

  it("accepts string values for URL fields", () => {
    const result = CreatorProfileResponseSchema.parse({
      ...VALID_CREATOR_PROFILE,
      avatarUrl: "/api/creators/user1/avatar",
      bannerUrl: "/api/creators/user1/banner",
    });
    expect(result.avatarUrl).toBe("/api/creators/user1/avatar");
    expect(result.bannerUrl).toBe("/api/creators/user1/banner");
  });

  it("rejects empty object", () => {
    expect(() => CreatorProfileResponseSchema.parse({})).toThrow();
  });

  it("rejects negative contentCount", () => {
    expect(() =>
      CreatorProfileResponseSchema.parse({
        ...VALID_CREATOR_PROFILE,
        contentCount: -1,
      }),
    ).toThrow();
  });

  it("rejects non-integer contentCount", () => {
    expect(() =>
      CreatorProfileResponseSchema.parse({
        ...VALID_CREATOR_PROFILE,
        contentCount: 1.5,
      }),
    ).toThrow();
  });

  it("validates bandcampEmbeds as a string array", () => {
    const result = CreatorProfileResponseSchema.parse({
      ...VALID_CREATOR_PROFILE,
      bandcampEmbeds: [
        "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
        "https://bandcamp.com/EmbeddedPlayer/track=456",
      ],
    });
    expect(result.bandcampEmbeds).toHaveLength(2);
    expect(result.bandcampEmbeds[0]).toBe(
      "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
    );
  });

  it("validates bandcampEmbeds as an empty array", () => {
    const result = CreatorProfileResponseSchema.parse({
      ...VALID_CREATOR_PROFILE,
      bandcampEmbeds: [],
    });
    expect(result.bandcampEmbeds).toHaveLength(0);
  });

  it("rejects when bandcampEmbeds is missing", () => {
    const { bandcampEmbeds: _, ...withoutEmbeds } = VALID_CREATOR_PROFILE;
    expect(() =>
      CreatorProfileResponseSchema.parse(withoutEmbeds),
    ).toThrow();
  });
});

describe("CreatorListItemSchema", () => {
  it("validates the same shape as CreatorProfileResponseSchema", () => {
    const result = CreatorListItemSchema.parse(VALID_CREATOR_PROFILE);
    expect(result.userId).toBe(VALID_CREATOR_PROFILE.userId);
    expect(result.displayName).toBe(VALID_CREATOR_PROFILE.displayName);
  });

  it("is the same schema reference as CreatorProfileResponseSchema", () => {
    expect(CreatorListItemSchema).toBe(CreatorProfileResponseSchema);
  });
});

describe("CreatorListQuerySchema", () => {
  it("parses empty object to defaults (limit = 24)", () => {
    const result = CreatorListQuerySchema.parse({});
    expect(result).toStrictEqual({ limit: 24 });
  });

  it("coerces string limit to number", () => {
    const result = CreatorListQuerySchema.parse({ limit: "30" });
    expect(result.limit).toBe(30);
  });

  it("accepts limit at minimum boundary (1)", () => {
    const result = CreatorListQuerySchema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("accepts limit at maximum boundary (50)", () => {
    const result = CreatorListQuerySchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it("rejects limit below minimum (0)", () => {
    expect(() => CreatorListQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit above maximum (51)", () => {
    expect(() => CreatorListQuerySchema.parse({ limit: 51 })).toThrow();
  });

  it("rejects negative limit", () => {
    expect(() => CreatorListQuerySchema.parse({ limit: -1 })).toThrow();
  });

  it("rejects non-integer limit", () => {
    expect(() => CreatorListQuerySchema.parse({ limit: 5.5 })).toThrow();
  });

  it("accepts optional cursor string", () => {
    const cursor =
      "eyJjcmVhdGVkQXQiOiIyMDI2LTAxLTAxIiwidXNlcklkIjoiYWJjIn0=";
    const result = CreatorListQuerySchema.parse({ cursor });
    expect(result.cursor).toBe(cursor);
  });
});

describe("CreatorListResponseSchema", () => {
  it("validates a response with items and nextCursor", () => {
    const result = CreatorListResponseSchema.parse({
      items: [VALID_CREATOR_PROFILE],
      nextCursor: "eyJ...",
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("eyJ...");
  });

  it("validates a last-page response with null nextCursor", () => {
    const result = CreatorListResponseSchema.parse({
      items: [VALID_CREATOR_PROFILE],
      nextCursor: null,
    });
    expect(result.nextCursor).toBeNull();
  });

  it("validates an empty list (no items, null cursor)", () => {
    const result = CreatorListResponseSchema.parse({
      items: [],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("validates a response with multiple items", () => {
    const item2 = { ...VALID_CREATOR_PROFILE, userId: "user_creator2" };
    const result = CreatorListResponseSchema.parse({
      items: [VALID_CREATOR_PROFILE, item2],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[1]!.userId).toBe("user_creator2");
  });

  it("rejects when items is missing", () => {
    expect(() =>
      CreatorListResponseSchema.parse({ nextCursor: null }),
    ).toThrow();
  });

  it("rejects when nextCursor is missing", () => {
    expect(() =>
      CreatorListResponseSchema.parse({ items: [] }),
    ).toThrow();
  });

  it("rejects when nextCursor is undefined", () => {
    expect(() =>
      CreatorListResponseSchema.parse({ items: [], nextCursor: undefined }),
    ).toThrow();
  });
});

// ── Type-level assertions (compile-time only) ──

const _updateCheck: UpdateCreatorProfile = {};
const _profileCheck: CreatorProfileResponse = VALID_CREATOR_PROFILE;
const _listItemCheck: CreatorListItem = VALID_CREATOR_PROFILE;
const _queryCheck: CreatorListQuery = { limit: 24 };
const _responseCheck: CreatorListResponse = { items: [], nextCursor: null };
