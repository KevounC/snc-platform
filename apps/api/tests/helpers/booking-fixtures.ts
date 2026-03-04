// ── Private Types ──

type DbServiceRow = {
  id: string;
  name: string;
  description: string;
  pricingInfo: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type DbBookingRequestRow = {
  id: string;
  userId: string;
  serviceId: string;
  preferredDates: string[];
  notes: string;
  status: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ── DB Record Fixtures ──

export const makeMockService = (
  overrides?: Partial<DbServiceRow>,
): DbServiceRow => ({
  id: "svc_test_recording",
  name: "Recording Session",
  description: "Professional studio recording session with engineer.",
  pricingInfo: "$50/hour",
  active: true,
  sortOrder: 0,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  updatedAt: new Date("2026-01-15T10:00:00.000Z"),
  ...overrides,
});

export const makeMockBookingRequest = (
  overrides?: Partial<DbBookingRequestRow>,
): DbBookingRequestRow => ({
  id: "bk_test_001",
  userId: "user_test123",
  serviceId: "svc_test_recording",
  preferredDates: ["2026-03-15"],
  notes: "",
  status: "pending",
  reviewedBy: null,
  reviewNote: null,
  createdAt: new Date("2026-02-20T14:30:00.000Z"),
  updatedAt: new Date("2026-02-20T14:30:00.000Z"),
  ...overrides,
});

export const makeMockUserRow = (
  overrides?: Partial<DbUserRow>,
): DbUserRow => ({
  id: "user_requester1",
  name: "Jane Doe",
  email: "jane@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2025-06-01T00:00:00.000Z"),
  updatedAt: new Date("2025-06-01T00:00:00.000Z"),
  ...overrides,
});

/**
 * Factory returning a 3-way join row shape matching what Drizzle returns
 * from `select().from(bookingRequests).innerJoin(services).innerJoin(users)`.
 */
export const makeMockBookingWithUser = (overrides?: {
  booking?: Partial<DbBookingRequestRow>;
  service?: Partial<DbServiceRow>;
  user?: Partial<DbUserRow>;
}): {
  booking_requests: DbBookingRequestRow;
  services: DbServiceRow;
  users: DbUserRow;
} => ({
  booking_requests: makeMockBookingRequest(overrides?.booking),
  services: makeMockService(overrides?.service),
  users: makeMockUserRow(overrides?.user),
});
