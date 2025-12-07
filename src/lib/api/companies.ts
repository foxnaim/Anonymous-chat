/**
 * API сервисы для работы с компаниями, статистикой, планами и админами
 */

import { Company, Stats, MessageDistribution, GrowthMetrics, SubscriptionPlan, AdminUser, AchievementProgress } from "@/types";
import { messageApi } from "./messages";
import { API_CONFIG } from "../query/constants";
import { getCompanyAchievements, getGroupedAchievements, type GroupedAchievements } from "../achievements";

// Симуляция задержки API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Моковые данные компаний
const mockCompanies: Company[] = [
  {
    id: 1,
    name: "Acme Corporation",
    code: "ACME0001",
    adminEmail: "admin@acme.com",
    status: "Активна",
    plan: "Про",
    registered: "2024-01-15",
    employees: 245,
    messages: 127,
    messagesThisMonth: 34,
    messagesLimit: 100,
    storageUsed: 2.4,
    storageLimit: 10,
  },
  {
    id: 2,
    name: "TechStart Inc",
    code: "TECH0001",
    adminEmail: "sarah.smith@techstart.com",
    status: "Пробная",
    plan: "Бесплатный",
    registered: "2024-03-10",
    trialEndDate: "2024-05-10",
    employees: 45,
    messages: 23,
    messagesThisMonth: 12,
    messagesLimit: 999999,
    storageUsed: 0.8,
    storageLimit: 999999,
  },
  {
    id: 3,
    name: "Global Solutions",
    code: "GLOB0001",
    adminEmail: "mike.jones@global.com",
    status: "Активна",
    plan: "Бизнес",
    registered: "2023-11-20",
    employees: 890,
    messages: 456,
    messagesThisMonth: 89,
    messagesLimit: 500,
    storageUsed: 8.2,
    storageLimit: 50,
  },
  {
    id: 4,
    name: "StartupCo",
    code: "STUP0001",
    adminEmail: "lisa.wang@startup.com",
    status: "Заблокирована",
    plan: "Бесплатный",
    registered: "2024-02-28",
    employees: 12,
    messages: 8,
    messagesThisMonth: 0,
    messagesLimit: 10,
    storageUsed: 0.1,
    storageLimit: 1,
  },
];

export const companyApi = {
  getAll: async (): Promise<Company[]> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    return mockCompanies;
  },

  getById: async (id: number): Promise<Company | null> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    return mockCompanies.find((c) => c.id === id) || null;
  },

  getByCode: async (code: string): Promise<Company | null> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    return mockCompanies.find((c) => c.code === code) || null;
  },

  create: async (company: Omit<Company, "id" | "registered" | "messages">): Promise<Company> => {
    await delay(API_CONFIG.TIMEOUT);
    const registeredDate = new Date().toISOString().split("T")[0];
    const trialEndDate = company.trialEndDate || (() => {
      const endDate = new Date(registeredDate);
      endDate.setMonth(endDate.getMonth() + 2);
      return endDate.toISOString().split("T")[0];
    })();
    
    const isTrial = company.status === "Пробная";
    
    const newCompany: Company = {
      ...company,
      id: mockCompanies.length + 1,
      registered: registeredDate,
      messages: 0,
      trialEndDate,
      messagesLimit: isTrial ? 999999 : company.messagesLimit,
      storageLimit: isTrial ? 999999 : company.storageLimit,
      messagesThisMonth: 0,
      storageUsed: 0,
    };
    mockCompanies.push(newCompany);
    return newCompany;
  },

  update: async (id: number, updates: Partial<Company>): Promise<Company> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const company = mockCompanies.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");
    Object.assign(company, updates);
    return company;
  },

  updateStatus: async (id: number, status: Company["status"]): Promise<Company> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const company = mockCompanies.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");
    company.status = status;
    return company;
  },
};

export const statsApi = {
  getCompanyStats: async (companyId: number): Promise<Stats> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const companyMessages = await messageApi.getAll();
    const company = mockCompanies.find((c) => c.id === companyId);
    const filteredMessages = company ? companyMessages.filter((m) => m.companyCode === company.code) : [];
    return {
      new: filteredMessages.filter((m) => m.status === "Новое").length,
      inProgress: filteredMessages.filter((m) => m.status === "В работе").length,
      resolved: filteredMessages.filter((m) => m.status === "Решено").length,
      total: filteredMessages.length,
    };
  },

  getMessageDistribution: async (companyId: number): Promise<MessageDistribution> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const company = mockCompanies.find((c) => c.id === companyId);
    if (!company) return { complaints: 0, praises: 0, suggestions: 0 };
    const companyMessages = await messageApi.getAll(company.code);
    return {
      complaints: companyMessages.filter((m) => m.type === "complaint").length,
      praises: companyMessages.filter((m) => m.type === "praise").length,
      suggestions: companyMessages.filter((m) => m.type === "suggestion").length,
    };
  },

  getGrowthMetrics: async (companyId: number): Promise<GrowthMetrics> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const company = mockCompanies.find((c) => c.id === companyId);
    if (!company) {
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
        },
      };
    }

    const companyMessages = await messageApi.getAll(company.code);
    
    // Получаем статистику напрямую
    const filteredMessages = companyMessages;
    const stats = {
      new: filteredMessages.filter((m) => m.status === "Новое").length,
      inProgress: filteredMessages.filter((m) => m.status === "В работе").length,
      resolved: filteredMessages.filter((m) => m.status === "Решено").length,
      total: filteredMessages.length,
    };
    
    const distribution = {
      complaints: filteredMessages.filter((m) => m.type === "complaint").length,
      praises: filteredMessages.filter((m) => m.type === "praise").length,
      suggestions: filteredMessages.filter((m) => m.type === "suggestion").length,
    };

    // Расчет баллов за решенные проблемы
    // Учитываем только решенные жалобы и предложения
    const resolvedComplaints = companyMessages.filter(
      (m) => m.type === "complaint" && m.status === "Решено"
    ).length;
    const resolvedSuggestions = companyMessages.filter(
      (m) => m.type === "suggestion" && m.status === "Решено"
    ).length;
    const totalResolved = resolvedComplaints + resolvedSuggestions;
    const totalProblems = distribution.complaints + distribution.suggestions;
    
    // Баллы за решенные проблемы (максимум 50 баллов)
    // Процент решенных проблем от общего количества проблем
    const resolvedRatio = totalProblems > 0 ? (totalResolved / totalProblems) : 0;
    const resolvedPoints = resolvedRatio * 50; // 0-50 баллов

    // Расчет баллов за скорость ответа
    // Учитываем только сообщения с ответами
    let responseSpeedPoints = 0;
    let totalResponses = 0;
    
    companyMessages.forEach((msg) => {
      if (msg.companyResponse && msg.updatedAt) {
        totalResponses++;
        const created = new Date(msg.createdAt);
        const updated = new Date(msg.updatedAt);
        const daysDiff = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        
        // Баллы за скорость ответа (быстрее = больше баллов)
        if (daysDiff <= 1) responseSpeedPoints += 5;
        else if (daysDiff <= 3) responseSpeedPoints += 3;
        else if (daysDiff <= 7) responseSpeedPoints += 1;
      }
    });
    
    // Нормализуем баллы за скорость ответа (максимум 50 баллов)
    // Если есть ответы, нормализуем по максимальному количеству баллов
    const maxSpeedPoints = totalResponses * 5; // Максимум если все ответы в течение 1 дня
    const normalizedSpeedPoints = maxSpeedPoints > 0 ? (responseSpeedPoints / maxSpeedPoints) * 50 : 0;

    // Общая сумма баллов (только решенные проблемы + скорость ответа)
    // Максимум 100 баллов = 10.0 рейтинг
    const totalPoints = resolvedPoints + normalizedSpeedPoints;
    
    // Конвертация в рейтинг (максимум 100 баллов = 10.0)
    const rating = Math.min(10, Math.round((totalPoints / 10) * 10) / 10);

    // Определение настроения
    let mood: "Позитивный" | "Нейтральный" | "Негативный" = "Нейтральный";
    if (rating >= 7) mood = "Позитивный";
    else if (rating <= 4) mood = "Негативный";

    // Определение тренда на основе изменения рейтинга
    // Упрощенная версия - можно улучшить с историей
    const trend: "up" | "down" | "stable" = "stable";

    // Расчет прогресса до следующего уровня
    const currentLevel = Math.floor(rating);
    const nextLevel = Math.min(10, currentLevel + 1);
    const progress = ((rating - currentLevel) / 1) * 100;

    return {
      rating,
      mood,
      trend,
      pointsBreakdown: {
        totalMessages: 0,
        resolvedCases: resolvedPoints,
        responseSpeed: normalizedSpeedPoints,
        activityBonus: 0,
        achievementsBonus: 0,
      },
      nextLevel: {
        current: currentLevel,
        next: nextLevel,
        progress: Math.round(progress),
      },
    };
  },

  getAchievements: async (companyId: number): Promise<AchievementProgress[]> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const company = mockCompanies.find((c) => c.id === companyId);
    if (!company) {
      return [];
    }

    const companyMessages = await messageApi.getAll(company.code);
    return getCompanyAchievements(companyMessages, company);
  },

  getGroupedAchievements: async (companyId: number): Promise<GroupedAchievements[]> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    const company = mockCompanies.find((c) => c.id === companyId);
    if (!company) {
      return [];
    }

    const companyMessages = await messageApi.getAll(company.code);
    return getGroupedAchievements(companyMessages, company);
  },
};

// Настройки бесплатного плана
let freePlanSettings = {
  messagesLimit: 10,
  storageLimit: 1,
  freePeriodDays: 0,
};

const customPlans: SubscriptionPlan[] = [];

export const plansApi = {
  getAll: async (): Promise<SubscriptionPlan[]> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    const defaultPlans: SubscriptionPlan[] = [
      {
        id: "free",
        name: {
          ru: "Бесплатный",
          en: "Free",
          kk: "Тегін"
        },
        price: 0,
        messagesLimit: freePlanSettings.messagesLimit,
        storageLimit: freePlanSettings.storageLimit,
        isFree: true,
        freePeriodDays: freePlanSettings.freePeriodDays,
        features: [
          {
            ru: `До ${freePlanSettings.messagesLimit} сообщений в месяц`,
            en: `Up to ${freePlanSettings.messagesLimit} messages per month`,
            kk: `Айына ${freePlanSettings.messagesLimit} хабарламаға дейін`
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
            ru: "Все функции бесплатного плана",
            en: "All free plan features",
            kk: "Тегін жоспардың барлық функциялары"
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
    return freePlanSettings;
  },

  updateFreePlanSettings: async (settings: { messagesLimit: number; storageLimit: number; freePeriodDays: number }): Promise<void> => {
    await delay(API_CONFIG.TIMEOUT / 2);
    freePlanSettings = { ...freePlanSettings, ...settings };
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

