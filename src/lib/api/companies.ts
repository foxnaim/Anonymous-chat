/**
 * API сервисы для работы с компаниями, статистикой, планами и админами
 */

import { Company, Stats, MessageDistribution, GrowthMetrics, SubscriptionPlan, AdminUser } from "@/types";
import { messageApi } from "./messages";
import { API_CONFIG } from "../query/constants";

// Симуляция задержки API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Моковые данные компаний
const mockCompanies: Company[] = [
  {
    id: 1,
    name: "Acme Corporation",
    code: "ACME001",
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
    code: "TECH001",
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
    code: "GLOB001",
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
    code: "STUP001",
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
    return {
      rating: 8.5,
      mood: "Позитивный",
      trend: "up",
    };
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
            ru: "Просмотр и управление сообщениями",
            en: "View and manage messages",
            kk: "Хабарламаларды көру және басқару"
          },
          {
            ru: "Базовая статистика",
            en: "Basic statistics",
            kk: "Негізгі статистика"
          },
        ],
      },
      {
        id: "pro",
        name: {
          ru: "Про",
          en: "Pro",
          kk: "Про"
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
            ru: "Расширенная аналитика",
            en: "Advanced analytics",
            kk: "Кеңейтілген аналитика"
          },
        ],
      },
      {
        id: "business",
        name: {
          ru: "Бизнес",
          en: "Business",
          kk: "Бизнес"
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
            ru: "Все функции плана Про",
            en: "All Pro plan features",
            kk: "Про жоспарының барлық функциялары"
          },
          {
            ru: "Полная аналитика",
            en: "Full analytics",
            kk: "Толық аналитика"
          },
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

