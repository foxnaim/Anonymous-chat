// Типы данных для приложения

export type MessageType = "complaint" | "praise" | "suggestion";
export type MessageStatus = "Новое" | "В работе" | "Решено" | "Отклонено" | "Спам";
export type UserRole = "user" | "company" | "admin" | "super_admin";
export type CompanyStatus = "Активна" | "Пробная" | "Заблокирована";
export type PlanType = "Пробный" | "Про" | "Бизнес" | string; // string для кастомных планов

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
  previousStatus?: MessageStatus; // Статус до пометки как спам админом
}

export interface Company {
  id: string | number; // Может быть строкой (MongoDB ObjectId) или числом (для совместимости)
  name: string;
  code: string;
  adminEmail: string;
  status: CompanyStatus;
  plan: PlanType;
  registered: string;
  trialEndDate?: string; // Дата окончания пробного периода (2 месяца после регистрации)
  employees?: number; // Опциональное поле, больше не используется в интерфейсе
  messages: number;
  messagesThisMonth?: number;
  messagesLimit?: number;
  storageUsed?: number; // Опциональное поле, больше не используется в интерфейсе
  storageLimit?: number;
  logoUrl?: string;
  fullscreenMode?: boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  // Mongo ObjectId приходит строкой, поэтому храним как string
  companyId?: string;
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
  pointsBreakdown?: {
    totalMessages: number;
    resolvedCases: number;
    responseSpeed: number;
    activityBonus: number;
    achievementsBonus: number;
  };
  nextLevel?: {
    current: number;
    next: number;
    progress: number;
  };
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
  lastLogin?: string | null;
}

// Типы для системы достижений
export type AchievementCategory = 
  | "reviews" // По количеству отзывов
  | "resolved" // По решенным проблемам
  | "response_speed" // По скорости ответа
  | "activity" // По активности
  | "quality" // По качеству работы
  | "longevity"; // По долгосрочности

export interface Achievement {
  id: string;
  category: AchievementCategory;
  titleKey: string; // Ключ для перевода
  descriptionKey?: string; // Ключ для описания
  target: number; // Целевое значение для достижения
  icon?: string; // Иконка достижения
  order: number; // Порядок отображения
  level?: number; // Уровень достижения внутри категории
}

export interface AchievementProgress {
  achievement: Achievement;
  current: number; // Текущее значение
  progress: number; // Прогресс в процентах (0-100)
  completed: boolean; // Завершено ли достижение
  completedAt?: string; // Дата завершения
}

