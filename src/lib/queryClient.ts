import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * React Query Client — FIXED
 *
 * KEY CHANGES:
 * - 401/403: NEVER retry (axios interceptor handles auth)
 * - 429: Retry with delay (rate limit is temporary)
 * - 5xx: Retry up to 2 times (server hiccup)
 * - Other 4xx: NEVER retry (client error, won't fix itself)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime: 10 * 60 * 1000,     // 10 minutes

      retry: (failureCount, error) => {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        // 401/403: Axios interceptor handles these — don't duplicate
        if (status === 401 || status === 403) return false;

        // 429: Rate limited — the axios interceptor already retries once
        // with Retry-After. If it still fails, React Query should NOT
        // pile on with more retries (that makes the rate limit worse)
        if (status === 429) return false;

        // Other 4xx: Client errors — retrying won't help
        if (status && status >= 400 && status < 500) return false;

        // 5xx: Server errors — retry up to 2 times
        return failureCount < 2;
      },

      // Reduce refetch aggressiveness to lower request volume
      refetchOnWindowFocus: true,    // Refetch stale queries on tab focus
      refetchOnReconnect: true,      // Refetch on network reconnect
      refetchOnMount: true,          // Refetch on component mount if stale
    },

    mutations: {
      retry: (failureCount, error) => {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        // Never retry client errors or rate limits for mutations
        if (status && status >= 400 && status < 500) return false;

        return failureCount < 1;
      },
    },
  },

  queryCache: new QueryCache({
    onError: (error, query) => {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      // Only log unexpected errors (not 401 which is handled by interceptor)
      if (status !== 401) {
        console.error('Query error:', {
          queryKey: query.queryKey,
          status,
          message: axiosError.message,
        });
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      if (status !== 401) {
        console.error('Mutation error:', {
          mutationKey: mutation.options.mutationKey,
          status,
          message: axiosError.message,
        });
      }
    },
  }),
});

/**
 * Query keys factory
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (filters?: any) => ['projects', 'list', filters] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    stats: (id: string) => ['projects', 'stats', id] as const,
    tasks: (id: string) => ['projects', id, 'tasks'] as const,
    budget: (id: string) => ['projects', id, 'budget'] as const,
    team: (id: string) => ['projects', id, 'team'] as const,
    documents: (id: string) => ['projects', id, 'documents'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    analytics: ['dashboard', 'analytics'] as const,
  },
  finance: {
    overview: (filters?: any) => ['finance', 'overview', filters] as const,
  },
  documents: {
    list: (projectId?: string) =>
      projectId ? ['documents', 'project', projectId] : (['documents', 'all'] as const),
    folders: ['documents', 'folders'] as const,
  },
  tasks: {
    list: (projectId: string) => ['tasks', 'project', projectId] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
  },
  brands: {
    all: ['brands'] as const,
    detail: (id: string) => ['brands', 'detail', id] as const,
    dashboard: (id: string) => ['brands', id, 'dashboard'] as const,
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  projects: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  },
  project: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.budget(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.team(id) });
  },
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.analytics });
  },
  all: () => {
    queryClient.invalidateQueries();
  },
};