/**
 * React Query конфигурация и хуки
 */

export { makeQueryClient } from './queryClient';
export * from './hooks';
export * from './services';
export * from './types';
export * from './constants';

// Re-export specific hooks for convenience
export { usePlans, useFreePlanSettings } from './hooks';


// Re-export services for direct use if needed
export { 
  messageService, 
  companyService, 
  statsService, 
  plansService, 
  adminService 
} from './services';
export { getMessagesList, setMessagesInCache } from './messagesCache';
export type { MessagesCacheValue } from './messagesCache';
export type { MessagesResponse, MessagesPagination } from './services';

// Query keys для централизованного управления
export const queryKeys = {
  adminSettings: ['admin-settings'] as const,
  // Messages
  messages: (companyCode?: string | null) => ['messages', companyCode ?? undefined] as const,
  message: (id: string) => ['message', id] as const,
  
  // Companies
  companies: ['admin-companies'] as const,
  company: (id: string | number) => ['company', id] as const,
  companyByCode: (code: string) => ['company-by-code', code] as const,
  
  // Stats
  companyStats: (companyId: string | number) => ['stats', companyId] as const,
  messageDistribution: (companyId: string | number) => ['message-distribution', companyId] as const,
  growthMetrics: (companyId: string | number) => ['growth-metrics', companyId] as const,
  achievements: (companyId: string | number) => ['achievements', companyId] as const,
  
  // Plans
  plans: ['plans'] as const,
  freePlanSettings: ['free-plan-settings'] as const,
  
  // Admins
  admins: ['admin-admins'] as const,
  
  // Platform
  platformStats: ['platform-stats'] as const,
  
  // Support
  supportInfo: ['support-info'] as const,
} as const;

