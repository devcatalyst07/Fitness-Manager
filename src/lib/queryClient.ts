import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Create React Query client with global error handling
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time - data stays in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests
      retry: (failureCount, error) => {
        const axiosError = error as AxiosError;
        
        // Don't retry on 4xx errors (client errors)
        if (axiosError.response?.status && axiosError.response.status < 500) {
          return false;
        }
        
        // Retry up to 2 times for 5xx errors
        return failureCount < 2;
      },
      
      // Refetch on window focus (only if data is stale)
      refetchOnWindowFocus: 'always',
      
      // Refetch on reconnect
      refetchOnReconnect: 'always',
      
      // Refetch on mount only if data is stale
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
  
  queryCache: new QueryCache({
    onError: (error, query) => {
      const axiosError = error as AxiosError;
      
      // Log errors for debugging
      console.error('Query error:', {
        queryKey: query.queryKey,
        error: axiosError.message,
        status: axiosError.response?.status,
      });
      
      // Handle auth errors globally
      if (axiosError.response?.status === 401) {
        // Session expired - handled by axios interceptor
        console.log('Auth error in query - session expired');
      }
    },
  }),
  
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      const axiosError = error as AxiosError;
      
      console.error('Mutation error:', {
        mutationKey: mutation.options.mutationKey,
        error: axiosError.message,
        status: axiosError.response?.status,
      });
    },
  }),
});

/**
 * Query keys factory for organized cache management
 */
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Projects
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
  
  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    analytics: ['dashboard', 'analytics'] as const,
  },
  
  // Finance
  finance: {
    overview: (filters?: any) => ['finance', 'overview', filters] as const,
  },
  
  // Documents
  documents: {
    list: (projectId?: string) => 
      projectId ? ['documents', 'project', projectId] : ['documents', 'all'] as const,
    folders: ['documents', 'folders'] as const,
  },
  
  // Tasks
  tasks: {
    list: (projectId: string) => ['tasks', 'project', projectId] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
  },
  
  // Brands
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
  // Invalidate all project-related queries
  projects: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  },
  
  // Invalidate specific project
  project: (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.budget(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.team(id) });
  },
  
  // Invalidate dashboard
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.analytics });
  },
  
  // Invalidate all queries (use sparingly)
  all: () => {
    queryClient.invalidateQueries();
  },
};