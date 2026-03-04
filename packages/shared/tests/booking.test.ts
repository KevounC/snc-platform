import { describe, it, expect } from "vitest";

import {
  BOOKING_STATUSES,
  BookingStatusSchema,
  ServiceSchema,
  BookingRequestSchema,
  BookingWithServiceSchema,
  CreateBookingRequestSchema,
  ServicesResponseSchema,
  MyBookingsQuerySchema,
  BookingResponseSchema,
  MyBookingsResponseSchema,
  RequesterSchema,
  PendingBookingItemSchema,
  PendingBookingsQuerySchema,
  PendingBookingsResponseSchema,
  ReviewBookingRequestSchema,
  type BookingStatus,
  type Service,
  type BookingRequest,
  type BookingWithService,
  type CreateBookingRequest,
  type ServicesResponse,
  type MyBookingsQuery,
  type BookingResponse,
  type MyBookingsResponse,
  type Requester,
  type PendingBookingItem,
  type PendingBookingsQuery,
  type PendingBookingsResponse,
  type ReviewBookingRequest,
} from "../src/index.js";

const VALID_SERVICE = {
  id: "svc_test123",
  name: "Recording Session",
  description: "Professional studio recording session with engineer.",
  pricingInfo: "Starting at $50/hour",
  active: true,
  sortOrder: 0,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

const VALID_BOOKING_REQUEST = {
  id: "bk_test456",
  userId: "user_abc",
  serviceId: "svc_test123",
  preferredDates: ["2026-03-15", "2026-03-16"],
  notes: "Afternoon preferred",
  status: "pending" as const,
  reviewedBy: null,
  reviewNote: null,
  createdAt: "2026-02-20T14:30:00.000Z",
  updatedAt: "2026-02-20T14:30:00.000Z",
};

const VALID_BOOKING_WITH_SERVICE = {
  ...VALID_BOOKING_REQUEST,
  service: VALID_SERVICE,
};

describe("BOOKING_STATUSES", () => {
  it('contains exactly ["pending", "approved", "denied"]', () => {
    expect(BOOKING_STATUSES).toStrictEqual(["pending", "approved", "denied"]);
  });

  it("has length 3", () => {
    expect(BOOKING_STATUSES).toHaveLength(3);
  });
});

describe("BookingStatusSchema", () => {
  it.each(["pending", "approved", "denied"])('accepts "%s"', (status) => {
    expect(BookingStatusSchema.parse(status)).toBe(status);
  });

  it("rejects invalid status", () => {
    expect(() => BookingStatusSchema.parse("cancelled")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => BookingStatusSchema.parse("")).toThrow();
  });
});

describe("ServiceSchema", () => {
  it("validates a complete service object", () => {
    const result = ServiceSchema.parse(VALID_SERVICE);
    expect(result.id).toBe("svc_test123");
    expect(result.name).toBe("Recording Session");
    expect(result.description).toBe(
      "Professional studio recording session with engineer.",
    );
    expect(result.pricingInfo).toBe("Starting at $50/hour");
    expect(result.active).toBe(true);
    expect(result.sortOrder).toBe(0);
    expect(result.createdAt).toBe("2026-01-15T10:00:00.000Z");
    expect(result.updatedAt).toBe("2026-01-15T10:00:00.000Z");
  });

  it("accepts inactive service", () => {
    const result = ServiceSchema.parse({ ...VALID_SERVICE, active: false });
    expect(result.active).toBe(false);
  });

  it("accepts non-zero sortOrder", () => {
    const result = ServiceSchema.parse({ ...VALID_SERVICE, sortOrder: 5 });
    expect(result.sortOrder).toBe(5);
  });

  it("rejects non-integer sortOrder", () => {
    expect(() =>
      ServiceSchema.parse({ ...VALID_SERVICE, sortOrder: 1.5 }),
    ).toThrow();
  });

  it("rejects invalid datetime for createdAt", () => {
    expect(() =>
      ServiceSchema.parse({ ...VALID_SERVICE, createdAt: "not-a-date" }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => ServiceSchema.parse({})).toThrow();
  });
});

describe("BookingRequestSchema", () => {
  it("validates a complete booking request", () => {
    const result = BookingRequestSchema.parse(VALID_BOOKING_REQUEST);
    expect(result.id).toBe("bk_test456");
    expect(result.userId).toBe("user_abc");
    expect(result.serviceId).toBe("svc_test123");
    expect(result.preferredDates).toStrictEqual([
      "2026-03-15",
      "2026-03-16",
    ]);
    expect(result.notes).toBe("Afternoon preferred");
    expect(result.status).toBe("pending");
    expect(result.reviewedBy).toBeNull();
    expect(result.reviewNote).toBeNull();
  });

  it("accepts nullable reviewedBy and reviewNote", () => {
    const result = BookingRequestSchema.parse({
      ...VALID_BOOKING_REQUEST,
      reviewedBy: null,
      reviewNote: null,
    });
    expect(result.reviewedBy).toBeNull();
    expect(result.reviewNote).toBeNull();
  });

  it("accepts non-null reviewedBy and reviewNote", () => {
    const result = BookingRequestSchema.parse({
      ...VALID_BOOKING_REQUEST,
      reviewedBy: "user_reviewer",
      reviewNote: "Approved for next week",
    });
    expect(result.reviewedBy).toBe("user_reviewer");
    expect(result.reviewNote).toBe("Approved for next week");
  });

  it.each(["pending", "approved", "denied"])(
    'accepts status "%s"',
    (status) => {
      const result = BookingRequestSchema.parse({
        ...VALID_BOOKING_REQUEST,
        status,
      });
      expect(result.status).toBe(status);
    },
  );

  it("rejects invalid status", () => {
    expect(() =>
      BookingRequestSchema.parse({
        ...VALID_BOOKING_REQUEST,
        status: "cancelled",
      }),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => BookingRequestSchema.parse({})).toThrow();
  });
});

describe("BookingWithServiceSchema", () => {
  it("validates booking with nested service", () => {
    const result = BookingWithServiceSchema.parse(
      VALID_BOOKING_WITH_SERVICE,
    );
    expect(result.id).toBe("bk_test456");
    expect(result.service.id).toBe("svc_test123");
    expect(result.service.name).toBe("Recording Session");
  });

  it("inherits all BookingRequestSchema fields", () => {
    const result = BookingWithServiceSchema.parse(
      VALID_BOOKING_WITH_SERVICE,
    );
    expect(result.userId).toBe("user_abc");
    expect(result.status).toBe("pending");
    expect(result.preferredDates).toStrictEqual([
      "2026-03-15",
      "2026-03-16",
    ]);
  });

  it("rejects missing service field", () => {
    expect(() =>
      BookingWithServiceSchema.parse(VALID_BOOKING_REQUEST),
    ).toThrow();
  });

  it("rejects invalid nested service", () => {
    expect(() =>
      BookingWithServiceSchema.parse({
        ...VALID_BOOKING_REQUEST,
        service: { invalid: true },
      }),
    ).toThrow();
  });
});

describe("CreateBookingRequestSchema", () => {
  it("validates serviceId, preferredDates, and notes", () => {
    const result = CreateBookingRequestSchema.parse({
      serviceId: "svc_test123",
      preferredDates: ["2026-03-15"],
      notes: "Afternoon preferred",
    });
    expect(result.serviceId).toBe("svc_test123");
    expect(result.preferredDates).toStrictEqual(["2026-03-15"]);
    expect(result.notes).toBe("Afternoon preferred");
  });

  it('defaults notes to "" when omitted', () => {
    const result = CreateBookingRequestSchema.parse({
      serviceId: "svc_test123",
      preferredDates: ["2026-03-15"],
    });
    expect(result.notes).toBe("");
  });

  it("accepts up to 5 preferred dates", () => {
    const result = CreateBookingRequestSchema.parse({
      serviceId: "svc_test123",
      preferredDates: ["d1", "d2", "d3", "d4", "d5"],
    });
    expect(result.preferredDates).toHaveLength(5);
  });

  it("rejects empty serviceId (min 1)", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        serviceId: "",
        preferredDates: ["2026-03-15"],
      }),
    ).toThrow();
  });

  it("rejects empty preferredDates array (min 1)", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        serviceId: "svc_test123",
        preferredDates: [],
      }),
    ).toThrow();
  });

  it("rejects preferredDates with >5 entries (max 5)", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        serviceId: "svc_test123",
        preferredDates: ["d1", "d2", "d3", "d4", "d5", "d6"],
      }),
    ).toThrow();
  });

  it("rejects empty strings in preferredDates", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        serviceId: "svc_test123",
        preferredDates: [""],
      }),
    ).toThrow();
  });

  it("rejects notes exceeding 2000 characters", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        serviceId: "svc_test123",
        preferredDates: ["2026-03-15"],
        notes: "x".repeat(2001),
      }),
    ).toThrow();
  });

  it("accepts notes at exactly 2000 characters", () => {
    const result = CreateBookingRequestSchema.parse({
      serviceId: "svc_test123",
      preferredDates: ["2026-03-15"],
      notes: "x".repeat(2000),
    });
    expect(result.notes).toHaveLength(2000);
  });

  it("rejects missing serviceId", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        preferredDates: ["2026-03-15"],
      }),
    ).toThrow();
  });

  it("rejects missing preferredDates", () => {
    expect(() =>
      CreateBookingRequestSchema.parse({
        serviceId: "svc_test123",
      }),
    ).toThrow();
  });
});

describe("ServicesResponseSchema", () => {
  it("validates services array", () => {
    const result = ServicesResponseSchema.parse({
      services: [VALID_SERVICE],
    });
    expect(result.services).toHaveLength(1);
    expect(result.services[0]!.name).toBe("Recording Session");
  });

  it("validates empty services array", () => {
    const result = ServicesResponseSchema.parse({ services: [] });
    expect(result.services).toHaveLength(0);
  });

  it("validates multiple services", () => {
    const service2 = { ...VALID_SERVICE, id: "svc_label", name: "Label Services" };
    const result = ServicesResponseSchema.parse({
      services: [VALID_SERVICE, service2],
    });
    expect(result.services).toHaveLength(2);
  });

  it("rejects missing services field", () => {
    expect(() => ServicesResponseSchema.parse({})).toThrow();
  });

  it("rejects invalid items in services array", () => {
    expect(() =>
      ServicesResponseSchema.parse({ services: [{ invalid: true }] }),
    ).toThrow();
  });
});

describe("MyBookingsQuerySchema", () => {
  it("defaults limit to 20 when omitted", () => {
    const result = MyBookingsQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("coerces string limit to number", () => {
    const result = MyBookingsQuerySchema.parse({ limit: "30" });
    expect(result.limit).toBe(30);
  });

  it("accepts limit at minimum boundary (1)", () => {
    const result = MyBookingsQuerySchema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("accepts limit at maximum boundary (50)", () => {
    const result = MyBookingsQuerySchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it("rejects limit below minimum (0)", () => {
    expect(() => MyBookingsQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit above maximum (51)", () => {
    expect(() => MyBookingsQuerySchema.parse({ limit: 51 })).toThrow();
  });

  it("accepts optional cursor", () => {
    const result = MyBookingsQuerySchema.parse({ cursor: "abc123" });
    expect(result.cursor).toBe("abc123");
  });

  it("accepts cursor and limit combined", () => {
    const result = MyBookingsQuerySchema.parse({
      cursor: "abc123",
      limit: 10,
    });
    expect(result.cursor).toBe("abc123");
    expect(result.limit).toBe(10);
  });
});

describe("BookingResponseSchema", () => {
  it("validates booking with nested service", () => {
    const result = BookingResponseSchema.parse({
      booking: VALID_BOOKING_WITH_SERVICE,
    });
    expect(result.booking.id).toBe("bk_test456");
    expect(result.booking.service.name).toBe("Recording Session");
  });

  it("rejects missing booking field", () => {
    expect(() => BookingResponseSchema.parse({})).toThrow();
  });
});

describe("MyBookingsResponseSchema", () => {
  it("validates items array with nextCursor", () => {
    const result = MyBookingsResponseSchema.parse({
      items: [VALID_BOOKING_WITH_SERVICE],
      nextCursor: "cursor_abc",
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("cursor_abc");
  });

  it("validates empty items with null nextCursor (last page)", () => {
    const result = MyBookingsResponseSchema.parse({
      items: [],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("validates multiple bookings", () => {
    const booking2 = {
      ...VALID_BOOKING_WITH_SERVICE,
      id: "bk_test789",
    };
    const result = MyBookingsResponseSchema.parse({
      items: [VALID_BOOKING_WITH_SERVICE, booking2],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(2);
  });

  it("rejects missing items field", () => {
    expect(() =>
      MyBookingsResponseSchema.parse({ nextCursor: null }),
    ).toThrow();
  });

  it("rejects invalid items in items array", () => {
    expect(() =>
      MyBookingsResponseSchema.parse({
        items: [{ invalid: true }],
        nextCursor: null,
      }),
    ).toThrow();
  });
});

const VALID_REQUESTER = {
  id: "user_requester1",
  name: "Jane Doe",
  email: "jane@example.com",
};

const VALID_PENDING_BOOKING_ITEM = {
  ...VALID_BOOKING_WITH_SERVICE,
  requester: VALID_REQUESTER,
};

describe("RequesterSchema", () => {
  it("validates { id, name, email }", () => {
    const result = RequesterSchema.parse(VALID_REQUESTER);
    expect(result.id).toBe("user_requester1");
    expect(result.name).toBe("Jane Doe");
    expect(result.email).toBe("jane@example.com");
  });

  it("rejects missing id", () => {
    expect(() =>
      RequesterSchema.parse({ name: "Jane Doe", email: "jane@example.com" }),
    ).toThrow();
  });

  it("rejects missing name", () => {
    expect(() =>
      RequesterSchema.parse({ id: "user_requester1", email: "jane@example.com" }),
    ).toThrow();
  });

  it("rejects missing email", () => {
    expect(() =>
      RequesterSchema.parse({ id: "user_requester1", name: "Jane Doe" }),
    ).toThrow();
  });
});

describe("PendingBookingItemSchema", () => {
  it("validates booking with nested requester and service", () => {
    const result = PendingBookingItemSchema.parse(VALID_PENDING_BOOKING_ITEM);
    expect(result.id).toBe("bk_test456");
    expect(result.service.id).toBe("svc_test123");
    expect(result.requester.id).toBe("user_requester1");
    expect(result.requester.name).toBe("Jane Doe");
  });

  it("inherits all BookingWithServiceSchema fields", () => {
    const result = PendingBookingItemSchema.parse(VALID_PENDING_BOOKING_ITEM);
    expect(result.userId).toBe("user_abc");
    expect(result.status).toBe("pending");
    expect(result.preferredDates).toStrictEqual(["2026-03-15", "2026-03-16"]);
    expect(result.service.name).toBe("Recording Session");
  });

  it("rejects missing requester field", () => {
    expect(() =>
      PendingBookingItemSchema.parse(VALID_BOOKING_WITH_SERVICE),
    ).toThrow();
  });

  it("rejects invalid requester object", () => {
    expect(() =>
      PendingBookingItemSchema.parse({
        ...VALID_BOOKING_WITH_SERVICE,
        requester: { invalid: true },
      }),
    ).toThrow();
  });
});

describe("PendingBookingsQuerySchema", () => {
  it("defaults limit to 20 when omitted", () => {
    const result = PendingBookingsQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("coerces string limit to number", () => {
    const result = PendingBookingsQuerySchema.parse({ limit: "30" });
    expect(result.limit).toBe(30);
  });

  it("accepts limit at minimum boundary (1)", () => {
    const result = PendingBookingsQuerySchema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("accepts limit at maximum boundary (50)", () => {
    const result = PendingBookingsQuerySchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it("rejects limit below minimum (0)", () => {
    expect(() => PendingBookingsQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects limit above maximum (51)", () => {
    expect(() => PendingBookingsQuerySchema.parse({ limit: 51 })).toThrow();
  });

  it("accepts optional cursor", () => {
    const result = PendingBookingsQuerySchema.parse({ cursor: "abc123" });
    expect(result.cursor).toBe("abc123");
  });
});

describe("PendingBookingsResponseSchema", () => {
  it("validates items array with nextCursor string", () => {
    const result = PendingBookingsResponseSchema.parse({
      items: [VALID_PENDING_BOOKING_ITEM],
      nextCursor: "cursor_abc",
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("cursor_abc");
  });

  it("validates empty items with null nextCursor (last page)", () => {
    const result = PendingBookingsResponseSchema.parse({
      items: [],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("validates multiple pending booking items", () => {
    const item2 = { ...VALID_PENDING_BOOKING_ITEM, id: "bk_test999" };
    const result = PendingBookingsResponseSchema.parse({
      items: [VALID_PENDING_BOOKING_ITEM, item2],
      nextCursor: null,
    });
    expect(result.items).toHaveLength(2);
  });

  it("rejects missing items field", () => {
    expect(() =>
      PendingBookingsResponseSchema.parse({ nextCursor: null }),
    ).toThrow();
  });

  it("rejects invalid items in array", () => {
    expect(() =>
      PendingBookingsResponseSchema.parse({
        items: [{ invalid: true }],
        nextCursor: null,
      }),
    ).toThrow();
  });
});

describe("ReviewBookingRequestSchema", () => {
  it('accepts { status: "approved" }', () => {
    const result = ReviewBookingRequestSchema.parse({ status: "approved" });
    expect(result.status).toBe("approved");
    expect(result.reviewNote).toBeUndefined();
  });

  it('accepts { status: "approved", reviewNote: "Looks good" }', () => {
    const result = ReviewBookingRequestSchema.parse({
      status: "approved",
      reviewNote: "Looks good",
    });
    expect(result.status).toBe("approved");
    expect(result.reviewNote).toBe("Looks good");
  });

  it('accepts { status: "denied", reviewNote: "Not available" }', () => {
    const result = ReviewBookingRequestSchema.parse({
      status: "denied",
      reviewNote: "Not available",
    });
    expect(result.status).toBe("denied");
    expect(result.reviewNote).toBe("Not available");
  });

  it('accepts { status: "denied" } without reviewNote', () => {
    const result = ReviewBookingRequestSchema.parse({ status: "denied" });
    expect(result.status).toBe("denied");
    expect(result.reviewNote).toBeUndefined();
  });

  it('rejects { status: "pending" } (not a valid review action)', () => {
    expect(() =>
      ReviewBookingRequestSchema.parse({ status: "pending" }),
    ).toThrow();
  });

  it("rejects invalid status value", () => {
    expect(() =>
      ReviewBookingRequestSchema.parse({ status: "cancelled" }),
    ).toThrow();
  });

  it("rejects reviewNote exceeding 2000 characters", () => {
    expect(() =>
      ReviewBookingRequestSchema.parse({
        status: "denied",
        reviewNote: "x".repeat(2001),
      }),
    ).toThrow();
  });

  it("accepts reviewNote at exactly 2000 characters", () => {
    const result = ReviewBookingRequestSchema.parse({
      status: "denied",
      reviewNote: "x".repeat(2000),
    });
    expect(result.reviewNote).toHaveLength(2000);
  });
});

// ── Type-level assertions (compile-time only) ──

const _statusCheck: BookingStatus = "pending";
const _serviceCheck: Service = VALID_SERVICE;
const _bookingCheck: BookingRequest = VALID_BOOKING_REQUEST;
const _bookingWithServiceCheck: BookingWithService = VALID_BOOKING_WITH_SERVICE;
const _createCheck: CreateBookingRequest = {
  serviceId: "svc_test123",
  preferredDates: ["2026-03-15"],
  notes: "",
};
const _servicesResponseCheck: ServicesResponse = { services: [] };
const _queryCheck: MyBookingsQuery = { limit: 20 };
const _bookingResponseCheck: BookingResponse = {
  booking: VALID_BOOKING_WITH_SERVICE,
};
const _myBookingsCheck: MyBookingsResponse = {
  items: [],
  nextCursor: null,
};
const _requesterCheck: Requester = VALID_REQUESTER;
const _pendingBookingItemCheck: PendingBookingItem = VALID_PENDING_BOOKING_ITEM;
const _pendingBookingsQueryCheck: PendingBookingsQuery = { limit: 20 };
const _pendingBookingsResponseCheck: PendingBookingsResponse = {
  items: [],
  nextCursor: null,
};
const _reviewBookingRequestCheck: ReviewBookingRequest = { status: "approved" };
