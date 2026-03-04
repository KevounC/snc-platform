import type { Service, BookingWithService } from "@snc/shared";

// ── Web-level Fixtures (API response shapes consumed by frontend components) ──

export const makeMockService = (
  overrides?: Partial<Service>,
): Service => ({
  id: "svc_test_recording",
  name: "Recording Session",
  description: "Professional studio recording session with engineer.",
  pricingInfo: "$50/hour",
  active: true,
  sortOrder: 0,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
  ...overrides,
});

export const makeMockBookingWithService = (
  overrides?: Partial<BookingWithService>,
): BookingWithService => ({
  id: "bk_test_001",
  userId: "user_test123",
  serviceId: "svc_test_recording",
  preferredDates: ["2026-03-15"],
  notes: "",
  status: "pending",
  reviewedBy: null,
  reviewNote: null,
  createdAt: "2026-02-20T14:30:00.000Z",
  updatedAt: "2026-02-20T14:30:00.000Z",
  service: {
    id: "svc_test_recording",
    name: "Recording Session",
    description: "Professional studio recording session with engineer.",
    pricingInfo: "$50/hour",
    active: true,
    sortOrder: 0,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  ...overrides,
});
