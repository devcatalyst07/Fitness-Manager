/**
 * Legacy API helper — FIXED
 *
 * KEY CHANGE: Delegates to apiClient from lib/axios.ts
 * This maintains backward compatibility for any code still importing fetchWithAuth
 * while using the unified cookie-based auth system.
 */

import { apiClient } from './axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

/**
 * Fetch with authentication — now uses cookie-based apiClient
 *
 * @deprecated Prefer importing `apiClient` from `@/lib/axios` directly
 */
export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toLowerCase();

  // Parse body if it's a string
  let data: any = undefined;
  if (options.body && typeof options.body === 'string') {
    try {
      data = JSON.parse(options.body);
    } catch {
      data = options.body;
    }
  }

  switch (method) {
    case 'post':
      return apiClient.post<T>(endpoint, data);
    case 'put':
      return apiClient.put<T>(endpoint, data);
    case 'delete':
      return apiClient.delete<T>(endpoint);
    case 'patch':
      return apiClient.patch<T>(endpoint, data);
    default:
      return apiClient.get<T>(endpoint);
  }
}