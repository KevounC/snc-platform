import type {
  AdminUsersResponse,
  AdminUserResponse,
  AssignRoleRequest,
  RevokeRoleRequest,
} from "@snc/shared";

import { apiGet, apiMutate } from "./fetch-utils.js";

// ── Public API ──

export async function fetchAdminUsers(params?: {
  cursor?: string;
  limit?: number;
}): Promise<AdminUsersResponse> {
  return apiGet<AdminUsersResponse>("/api/admin/users", params);
}

export async function assignRole(
  userId: string,
  data: AssignRoleRequest,
): Promise<AdminUserResponse> {
  return apiMutate<AdminUserResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/roles`,
    { method: "POST", body: data },
  );
}

export async function revokeRole(
  userId: string,
  data: RevokeRoleRequest,
): Promise<AdminUserResponse> {
  return apiMutate<AdminUserResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/roles`,
    { method: "DELETE", body: data },
  );
}
