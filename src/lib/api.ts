export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-4lax2qt7n-rj-turingans-projects.vercel.app/';

export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Only access localStorage in the browser
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Explicitly type headers as Record<string, string>
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized (401) only in the browser
  if (typeof window !== 'undefined' && response.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return Promise.reject(new Error('Unauthorized'));
  }

  // Parse JSON response
  const data: T = await response.json();
  return data;
}
