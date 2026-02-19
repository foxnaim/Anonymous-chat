/**
 * Общие константы приложения
 */

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SEND_MESSAGE: '/',
  CHECK_STATUS: '/check-status',
  COMPANY: '/company',
  ADMIN: '/admin',
} as const;

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

// Debounce Delays
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  API: 800,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MESSAGES_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Message Statuses
export const MESSAGE_STATUSES = {
  NEW: 'Новое',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решено',
  REJECTED: 'Отклонено',
  SPAM: 'Спам',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  COMPLAINT: 'complaint',
  PRAISE: 'praise',
  SUGGESTION: 'suggestion',
} as const;

// Company Statuses
export const COMPANY_STATUSES = {
  ACTIVE: 'Активна',
  TRIAL: 'Пробная',
  BLOCKED: 'Заблокирована',
} as const;

// User Roles
export const USER_ROLES = {
  COMPANY: 'company',
  ADMIN: 'admin',
} as const;

