import type {
  Service,
  BookingWithService,
  CreateBookingRequest,
  MyBookingsResponse,
} from "@snc/shared";

import { apiGet, apiMutate } from "./fetch-utils.js";

// ── Public API ──

/**
 * Fetch all active services.
 */
export async function fetchServices(): Promise<Service[]> {
  const data = await apiGet<{ services: Service[] }>("/api/services");
  return data.services;
}

/**
 * Fetch a single service by ID.
 */
export async function fetchServiceById(id: string): Promise<Service> {
  const data = await apiGet<{ service: Service }>(
    `/api/services/${encodeURIComponent(id)}`,
  );
  return data.service;
}

/**
 * Submit a booking request.
 * Returns the created booking with nested service data.
 */
export async function createBooking(
  data: CreateBookingRequest,
): Promise<BookingWithService> {
  const result = await apiMutate<{ booking: BookingWithService }>(
    "/api/bookings",
    { body: data },
  );
  return result.booking;
}

/**
 * Fetch the authenticated user's booking requests with optional pagination.
 */
export async function fetchMyBookings(params?: {
  cursor?: string;
  limit?: number;
}): Promise<MyBookingsResponse> {
  return apiGet<MyBookingsResponse>("/api/bookings/mine", params);
}

/**
 * Fetch a single booking request by ID.
 */
export async function fetchBookingById(
  id: string,
): Promise<BookingWithService> {
  const data = await apiGet<{ booking: BookingWithService }>(
    `/api/bookings/${encodeURIComponent(id)}`,
  );
  return data.booking;
}
