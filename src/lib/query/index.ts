/**
 * React Query конфигурация и хуки
 */

export { makeQueryClient } from './queryClient';
export * from './hooks';
export * from './services';
export * from './types';
export * from './constants';

// Re-export services for direct use if needed
export { 
  messageService, 
  companyService, 
  statsService, 
  plansService, 
  adminService 
} from './services';

// Query keys для централизованного управления
export const queryKeys = {
  // Messages
  messages: (companyCode?: string | null) => ['messages', companyCode ?? undefined] as const,
  message: (id: string) => ['message', id] as const,
  
  // Companies
  companies: ['admin-companies'] as const,
  company: (id: number) => ['company', id] as const,
  companyByCode: (code: string) => ['company-by-code', code] as const,
  
  // Stats
  companyStats: (companyId: number) => ['stats', companyId] as const,
  messageDistribution: (companyId: number) => ['message-distribution', companyId] as const,
  growthMetrics: (companyId: number) => ['growth-metrics', companyId] as const,
  
  // Plans
  plans: ['plans'] as const,
  freePlanSettings: ['free-plan-settings'] as const,
  
  // Admins
  admins: ['admin-admins'] as const,
  
  // Platform
  platformStats: ['platform-stats'] as const,
} as const;

