// Brand Service - API calls for brand management

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Get brand analytics (for line graph and stats)
export const getBrandAnalytics = async (brandId: string) => {
  const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch brand analytics");
  }

  const data = await response.json();

  // Find the specific brand's analytics
  const brandAnalytics = data.brandAnalytics.find(
    (b: any) => b.brandId === brandId,
  );

  return brandAnalytics || null;
};

// Get projects for a specific brand
export const getBrandProjects = async (brandName: string) => {
  const response = await fetch(`${API_URL}/api/projects`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  const allProjects = await response.json();

  // Filter projects by brand name
  return allProjects.filter((project: any) => project.brand === brandName);
};

// Get brand details
export const getBrand = async (brandId: string) => {
  const response = await fetch(`${API_URL}/api/brands/${brandId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch brand");
  }

  return response.json();
};

// Get all brands
export const getAllBrands = async () => {
  const response = await fetch(`${API_URL}/api/brands/all`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch brands");
  }

  return response.json();
};

export const brandService = {
  getBrandAnalytics,
  getBrandProjects,
  getBrand,
  getAllBrands,
};