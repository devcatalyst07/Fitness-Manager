/**
 * Brand Service — FIXED
 *
 * KEY CHANGE: Uses apiClient (cookie auth) instead of localStorage Bearer tokens
 */

import { apiClient } from '@/lib/axios';

export const getBrandAnalytics = async (brandId: string) => {
  const data = await apiClient.get('/api/admin/dashboard/stats');
  const brandAnalytics = data.brandAnalytics?.find(
    (b: any) => b.brandId === brandId
  );
  return brandAnalytics || null;
};

export const getBrandProjects = async (brandName: string) => {
  const allProjects = await apiClient.get('/api/projects');
  return allProjects.filter((project: any) => project.brand === brandName);
};

export const getBrand = async (brandId: string) => {
  return apiClient.get(`/api/brands/${brandId}`);
};

export const getAllBrands = async () => {
  return apiClient.get('/api/brands/all');
};

export const brandService = {
  getBrandAnalytics,
  getBrandProjects,
  getBrand,
  getAllBrands,
};