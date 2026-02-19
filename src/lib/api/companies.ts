/**
 * API сервисы для работы с компаниями, статистикой, планами и админами
 */

import { Stats, MessageDistribution, GrowthMetrics, SubscriptionPlan, AdminUser, AchievementProgress } from "@/types";
import type { GroupedAchievements } from "../achievements";
import { API_CONFIG } from "../query/constants";

// Симуляция задержки API (больше не используется, но оставлено для совместимости)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Моковые данные компаний удалены - теперь используется реальный API через companyService в services.ts
// Этот файл оставлен для обратной совместимости, но companyApi больше не используется

// Импортируем apiClient для реальных запросов
import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const statsApi = {
  getCompanyStats: async (companyId: string | number): Promise<Stats> => {
    try {
      const response = await apiClient.get<ApiResponse<Stats>>(`/stats/company/${companyId}`);
      return response.data;
    } catch (error) {
      // Если статистика не найдена, возвращаем пустую
      return { new: 0, inProgress: 0, resolved: 0, total: 0 };
    }
  },

  getMessageDistribution: async (companyId: string | number): Promise<MessageDistribution> => {
    try {
      const response = await apiClient.get<ApiResponse<MessageDistribution>>(`/stats/distribution/${companyId}`);
      return response.data;
    } catch (error) {
      return { complaints: 0, praises: 0, suggestions: 0 };
    }
  },

  getGrowthMetrics: async (companyId: string | number): Promise<GrowthMetrics> => {
    try {
      const response = await apiClient.get<ApiResponse<GrowthMetrics>>(`/stats/growth/${companyId}`);
      return response.data;
    } catch (error) {
      return {
        rating: 0,
        mood: "Нейтральный",
        trend: "stable",
        pointsBreakdown: {
          totalMessages: 0,
          resolvedCases: 0,
          responseSpeed: 0,
          activityBonus: 0,
          achievementsBonus: 0,
          praiseBonus: 0,
        },
      };
    }
  },

  getAchievements: async (companyId: string | number): Promise<AchievementProgress[]> => {
    try {
      const response = await apiClient.get<ApiResponse<AchievementProgress[]>>(`/stats/achievements/${companyId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getGroupedAchievements: async (companyId: string | number): Promise<GroupedAchievements[]> => {
    try {
      const response = await apiClient.get<ApiResponse<GroupedAchievements[]>>(`/stats/achievements/${companyId}/grouped`);
      return response.data;
    } catch (error) {
      return [];
    }
  },
};

// Настройки бесплатного плана — загружаются с сервера через getFreePlanSettings
let freePlanSettings: {
  messagesLimit: number;
  storageLimit: number;
  freePeriodDays: number;
} | null = null;

const customPlans: SubscriptionPlan[] = [];

async function ensureFreePlanSettings(): Promise<{
  messagesLimit: number;
  storageLimit: number;
  freePeriodDays: number;
}> {
  if (freePlanSettings) return freePlanSettings;
  const res = await apiClient.get<ApiResponse<{ messagesLimit: number; storageLimit: number; freePeriodDays: number }>>('/plans/free-settings');
  freePlanSettings = res.data;
  return freePlanSettings;
}

export const plansApi = {
  getAll: async (): Promise<SubscriptionPlan[]> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    const settings = await ensureFreePlanSettings();
    const defaultPlans: SubscriptionPlan[] = [
      {
        id: "free",
        name: {
          ru: "Пробный",
          en: "Trial",
          kk: "Сынақ"
        },
        price: 0,
        messagesLimit: settings.messagesLimit,
        storageLimit: settings.storageLimit,
        isFree: true,
        freePeriodDays: settings.freePeriodDays,
        features: [
          {
            ru: `Все функции на ${settings.freePeriodDays} ${settings.freePeriodDays === 1 ? 'день' : settings.freePeriodDays < 5 ? 'дня' : 'дней'}`,
            en: `All features for ${settings.freePeriodDays} ${settings.freePeriodDays === 1 ? 'day' : 'days'}`,
            kk: `Барлық функциялар ${settings.freePeriodDays} ${settings.freePeriodDays === 1 ? 'күн' : 'күнге'}`
          }
        ],
      },
      {
        id: "standard",
        name: {
          ru: "Стандарт",
          en: "Standard",
          kk: "Стандарт"
        },
        price: 2999,
        messagesLimit: 100,
        storageLimit: 10,
        features: [
          {
            ru: "До 100 сообщений в месяц",
            en: "Up to 100 messages per month",
            kk: "Айына 100 хабарламаға дейін"
          },
          {
            ru: "Без ограничений по времени",
            en: "No time restrictions",
            kk: "Уақыт шектеулері жоқ"
          },
          {
            ru: "Приём сообщений",
            en: "Receive messages",
            kk: "Хабарламаларды қабылдау"
          },
          {
            ru: "Просмотр сообщений",
            en: "View messages",
            kk: "Хабарламаларды көру"
          },
          {
            ru: "Управление статусами сообщений",
            en: "Manage message statuses",
            kk: "Хабарлама статустарын басқару"
          },
          {
            ru: "Фильтрация и поиск сообщений",
            en: "Filter and search messages",
            kk: "Хабарламаларды сүзгілеу және іздеу"
          },
          {
            ru: "Базовая статистика по типам",
            en: "Basic statistics by type",
            kk: "Түрлер бойынша негізгі статистика"
          },
          {
            ru: "Ответы на сообщения",
            en: "Respond to messages",
            kk: "Хабарламаларға жауап беру"
          },
          {
            ru: "Расширенная статистика",
            en: "Advanced statistics",
            kk: "Кеңейтілген статистика"
          },
          {
            ru: "Распределение по типам сообщений",
            en: "Message type distribution",
            kk: "Хабарлама түрлері бойынша бөлу"
          },
          {
            ru: "Статистика решённых кейсов",
            en: "Resolved cases statistics",
            kk: "Шешілген істер статистикасы"
          }
        ],
      },
      {
        id: "pro",
        name: {
          ru: "Про",
          en: "Pro",
          kk: "Про"
        },
        price: 9999,
        messagesLimit: 500,
        storageLimit: 50,
        features: [
          {
            ru: "До 500 сообщений в месяц",
            en: "Up to 500 messages per month",
            kk: "Айына 500 хабарламаға дейін"
          },
          {
            ru: "Без ограничений по времени",
            en: "No time restrictions",
            kk: "Уақыт шектеулері жоқ"
          },
          {
            ru: "Все функции плана Стандарт",
            en: "All Standard plan features",
            kk: "Стандарт жоспарының барлық функциялары"
          },
          {
            ru: "Полная аналитика и отчёты",
            en: "Full analytics and reports",
            kk: "Толық аналитика және есептер"
          },
          {
            ru: "Рейтинги и метрики роста",
            en: "Ratings and growth metrics",
            kk: "Рейтингтер және өсу метрикалары"
          },
          {
            ru: "Анализ трендов и настроения команды",
            en: "Trend analysis and team mood",
            kk: "Трендтерді талдау және команда көңіл-күйі"
          },
          {
            ru: "Экспорт отчётов в PDF",
            en: "PDF report export",
            kk: "PDF есептерді экспорттау"
          },
          {
            ru: "Детальная статистика по периодам",
            en: "Detailed statistics by period",
            kk: "Кезеңдер бойынша толық статистика"
          },
          {
            ru: "Достижения и прогресс",
            en: "Achievements and progress",
            kk: "Жетістіктер және прогресс"
          }
        ],
      },
    ];
    return [...defaultPlans, ...customPlans];
  },

  create: async (plan: Omit<SubscriptionPlan, "id">): Promise<SubscriptionPlan> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    customPlans.push(newPlan);
    return newPlan;
  },

  getFreePlanSettings: async () => {
    await delay(API_CONFIG.TIMEOUT / 5);
    return ensureFreePlanSettings();
  },

  updateFreePlanSettings: async (settings: { messagesLimit: number; storageLimit: number; freePeriodDays: number }): Promise<void> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    await apiClient.put('/plans/free-settings', settings);
    freePlanSettings = { ...(freePlanSettings || { storageLimit: 1 }), ...settings };
  },
};

export const adminApi = {
  getAdmins: async (): Promise<AdminUser[]> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    return [
      {
        id: "admin-1",
        email: "admin@feedbackhub.com",
        name: "Super Admin",
        role: "super_admin",
        createdAt: "2024-01-01",
        lastLogin: "2024-03-16",
      },
      {
        id: "admin-2",
        email: "moderator@feedbackhub.com",
        name: "Moderator",
        role: "admin",
        createdAt: "2024-02-15",
        lastLogin: "2024-03-15",
      },
    ];
  },
};

