// Типы данных для приложения

export type MessageType = "complaint" | "praise" | "suggestion";
export type MessageStatus = "Новое" | "В работе" | "Решено" | "Отклонено" | "Спам";
export type UserRole = "user" | "company" | "admin";
export type CompanyStatus = "Активна" | "Пробная" | "Заблокирована";
export type PlanType = "Бесплатный" | "Про" | "Бизнес" | string; // string для кастомных планов

export interface Message {
  id: string;
  companyCode: string;
  type: MessageType;
  content: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  lastUpdate?: string;
  companyResponse?: string;
  adminNotes?: string;
}

export interface Company {
  id: number;
  name: string;
  code: string;
  adminEmail: string;
  status: CompanyStatus;
  plan: PlanType;
  registered: string;
  trialEndDate?: string; // Дата окончания пробного периода (2 месяца после регистрации)
  employees: number;
  messages: number;
  messagesThisMonth?: number;
  messagesLimit?: number;
  storageUsed?: number;
  storageLimit?: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId?: number;
  name?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Stats {
  new: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export interface MessageDistribution {
  complaints: number;
  praises: number;
  suggestions: number;
}

export interface GrowthMetrics {
  rating: number;
  mood: "Позитивный" | "Нейтральный" | "Негативный";
  trend: "up" | "down" | "stable";
}

// Типы для переводов
export type TranslatedString = string | { ru: string; en: string; kk: string };

export interface SubscriptionPlan {
  id: string;
  name: PlanType | TranslatedString; // Может быть строкой (старые планы) или объектом с переводами
  price: number;
  messagesLimit: number;
  storageLimit: number;
  features: string[] | TranslatedString[]; // Может быть массивом строк или массивом объектов с переводами
  isFree?: boolean; // Является ли план бесплатным (настраивается админом)
  freePeriodDays?: number; // Количество дней бесплатного доступа (для бесплатного плана)
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  createdAt: string;
  lastLogin?: string;
}

