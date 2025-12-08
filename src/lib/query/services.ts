/**
 * API сервисы для React Query
 * Все API вызовы здесь, используются в query hooks
 */

import type { 
  Message, 
  Company, 
  Stats, 
  MessageDistribution, 
  GrowthMetrics, 
  SubscriptionPlan, 
  AdminUser,
  AchievementProgress,
  PlanType
} from "@/types";
import type { PlatformStats } from "./types";
import type { GroupedAchievements } from "../achievements";
import { DELAYS } from "./constants";

// Симуляция задержки API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ========== MOCK DATA ==========
const mockMessages: Message[] = [
  {
    id: "FB-2024-A7K9X2",
    companyCode: "ACME0001",
    type: "complaint",
    content: "Проблема с политикой удаленной работы. Недостаточно гибкости в выборе рабочего времени.",
    status: "В работе",
    createdAt: "2024-03-15",
    updatedAt: "2024-03-16",
    lastUpdate: "2024-03-16",
    companyResponse: "Ваш отзыв был рассмотрен HR-отделом и в настоящее время обрабатывается.",
  },
  {
    id: "FB-2024-B3M5Y1",
    companyCode: "ACME0001",
    type: "praise",
    content: "Отличное командное взаимодействие и поддержка со стороны руководства.",
    status: "В работе",
    createdAt: "2024-03-14",
    updatedAt: "2024-03-14",
  },
  {
    id: "FB-2024-C8N2Z4",
    companyCode: "ACME0001",
    type: "suggestion",
    content: "Рассмотрите возможность внедрения гибкого графика работы для повышения удовлетворенности сотрудников.",
    status: "Новое",
    createdAt: "2024-03-14",
    updatedAt: "2024-03-14",
  },
  {
    id: "FB-2024-D1P7X8",
    companyCode: "ACME0001",
    type: "complaint",
    content: "Распределение парковочных мест требует пересмотра. Недостаточно мест для всех сотрудников.",
    status: "Решено",
    createdAt: "2024-03-13",
    updatedAt: "2024-03-15",
    companyResponse: "Проблема решена. Добавлены дополнительные парковочные места.",
  },
  {
    id: "FB-2024-E4Q2W6",
    companyCode: "ACME0001",
    type: "praise",
    content: "Отличная работа команды разработки. Проекты выполняются в срок и с высоким качеством.",
    status: "Решено",
    createdAt: "2024-03-12",
    updatedAt: "2024-03-12",
  },
  {
    id: "FB-2024-F9R5Y3",
    companyCode: "TECH0001",
    type: "suggestion",
    content: "Предлагаю внедрить систему наставничества для новых сотрудников.",
    status: "Новое",
    createdAt: "2024-03-16",
    updatedAt: "2024-03-16",
  },
  {
    id: "FB-2024-G2S8Z7",
    companyCode: "TECH0001",
    type: "complaint",
    content: "Недостаточно оборудования для удаленной работы.",
    status: "В работе",
    createdAt: "2024-03-15",
    updatedAt: "2024-03-15",
  },
  {
    id: "FB-2024-H6T1X4",
    companyCode: "GLOB0001",
    type: "praise",
    content: "Отличная корпоративная культура и поддержка сотрудников.",
    status: "Решено",
    createdAt: "2024-03-14",
    updatedAt: "2024-03-14",
  },
];

const mockCompanies: Company[] = [
  {
    id: 1,
    name: "Acme Corporation",
    code: "ACME0001",
    adminEmail: "admin@acme.com",
    status: "Активна",
    plan: "Стандарт",
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
    plan: "Пробный",
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
    plan: "Пробный",
    registered: "2024-02-28",
    employees: 12,
    messages: 8,
    messagesThisMonth: 0,
    messagesLimit: 10,
    storageUsed: 0.1,
    storageLimit: 1,
  },
];

let freePlanSettings = {
  messagesLimit: 10, // Настраивается через админ-панель
  storageLimit: 1, // Фиксированное значение
  freePeriodDays: 60, // Настраивается через админ-панель (в днях)
};

const customPlans: SubscriptionPlan[] = [];

// ========== MESSAGE SERVICES ==========
export const messageService = {
  getAll: async (companyCode?: string): Promise<Message[]> => {
    await delay(DELAYS.NORMAL);
    if (companyCode) {
      return mockMessages.filter((m) => m.companyCode === companyCode);
    }
    return mockMessages;
  },

  getById: async (id: string): Promise<Message | null> => {
    await delay(DELAYS.FAST);
    return mockMessages.find((m) => m.id === id) || null;
  },

  create: async (message: Omit<Message, "id" | "createdAt" | "updatedAt" | "lastUpdate">): Promise<Message> => {
    await delay(DELAYS.SLOW);
    const now = new Date().toISOString().split("T")[0];
    const newMessage: Message = {
      ...message,
      id: `FB-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
      lastUpdate: now,
    };
    mockMessages.push(newMessage);
    return newMessage;
  },

  update: async (id: string, updates: Partial<Message>): Promise<Message> => {
    await delay(DELAYS.NORMAL);
    const message = mockMessages.find((m) => m.id === id);
    if (!message) throw new Error("Message not found");
    const now = new Date().toISOString().split("T")[0];
    Object.assign(message, { ...updates, updatedAt: now, lastUpdate: now });
    return message;
  },

  updateStatus: async (id: string, status: Message["status"], response?: string): Promise<Message> => {
    await delay(DELAYS.NORMAL);
    const message = mockMessages.find((m) => m.id === id);
    if (!message) throw new Error("Message not found");
    const now = new Date().toISOString().split("T")[0];
    message.status = status;
    message.updatedAt = now;
    message.lastUpdate = now;
    if (response) {
      message.companyResponse = response;
    }
    return message;
  },
};

// ========== COMPANY SERVICES ==========
export const companyService = {
  getAll: async (): Promise<Company[]> => {
    await delay(DELAYS.NORMAL);
    return mockCompanies;
  },

  getById: async (id: number): Promise<Company | null> => {
    await delay(DELAYS.FAST);
    return mockCompanies.find((c) => c.id === id) || null;
  },

  getByCode: async (code: string): Promise<Company | null> => {
    await delay(DELAYS.FAST);
    return mockCompanies.find((c) => c.code === code) || null;
  },

  create: async (company: Omit<Company, "id" | "registered" | "messages">): Promise<Company> => {
    await delay(DELAYS.SLOW);
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
    await delay(DELAYS.NORMAL);
    const company = mockCompanies.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");
    Object.assign(company, updates);
    return company;
  },

  updateStatus: async (id: number, status: Company["status"]): Promise<Company> => {
    await delay(DELAYS.NORMAL);
    const company = mockCompanies.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");
    company.status = status;
    return company;
  },

  updatePlan: async (id: number, plan: PlanType, planEndDate?: string): Promise<Company> => {
    await delay(DELAYS.NORMAL);
    const company = mockCompanies.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");
    company.plan = plan;
    if (planEndDate) {
      // Если указана дата окончания плана, можно сохранить её в trialEndDate или создать отдельное поле
      company.trialEndDate = planEndDate;
    }
    return company;
  },

  verifyPassword: async (code: string, password: string): Promise<boolean> => {
    await delay(DELAYS.FAST);
    const company = mockCompanies.find((c) => c.code === code);
    if (!company) return false;
    // Для демо: пароль "password12" (10 символов) для всех компаний
    // В реальном приложении здесь будет проверка хеша пароля
    return password === "password12";
  },
};

// ========== STATS SERVICES ==========
export const statsService = {
  getCompanyStats: async (companyId: number): Promise<Stats> => {
    await delay(DELAYS.STATS);
    const company = mockCompanies.find((c) => c.id === companyId);
    if (!company) {
      return { new: 0, inProgress: 0, resolved: 0, total: 0 };
    }
    
    // Оптимизация: один проход по массиву вместо множественных filter()
    let newCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    
    for (const message of mockMessages) {
      if (message.companyCode === company.code) {
        if (message.status === "Новое") newCount++;
        else if (message.status === "В работе") inProgressCount++;
        else if (message.status === "Решено") resolvedCount++;
      }
    }
    
    return {
      new: newCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      total: newCount + inProgressCount + resolvedCount,
    };
  },

  getMessageDistribution: async (companyId: number): Promise<MessageDistribution> => {
    await delay(DELAYS.STATS);
    const company = mockCompanies.find((c) => c.id === companyId);
    if (!company) return { complaints: 0, praises: 0, suggestions: 0 };
    
    // Оптимизация: один проход по массиву вместо множественных filter()
    let complaints = 0;
    let praises = 0;
    let suggestions = 0;
    
    for (const message of mockMessages) {
      if (message.companyCode === company.code) {
        if (message.type === "complaint") complaints++;
        else if (message.type === "praise") praises++;
        else if (message.type === "suggestion") suggestions++;
      }
    }
    
    return { complaints, praises, suggestions };
  },

  getGrowthMetrics: async (companyId: number): Promise<GrowthMetrics> => {
    await delay(DELAYS.STATS);
    // Используем логику из companies.ts
    const { statsApi } = await import("../api/companies");
    return statsApi.getGrowthMetrics(companyId);
  },

  getAchievements: async (companyId: number): Promise<AchievementProgress[]> => {
    await delay(DELAYS.STATS);
    const { statsApi } = await import("../api/companies");
    return statsApi.getAchievements(companyId);
  },

  getGroupedAchievements: async (companyId: number): Promise<GroupedAchievements[]> => {
    await delay(DELAYS.STATS);
    const { statsApi } = await import("../api/companies");
    return statsApi.getGroupedAchievements(companyId);
  },

  getPlatformStats: async (): Promise<PlatformStats> => {
    await delay(DELAYS.FAST); // Платформенная статистика - очень быстрая
    return {
      rooms: 42,
      latency: "54ms",
      retention: "92%"
    };
  },
};

// ========== PLANS SERVICES ==========
export const plansService = {
  getAll: async (): Promise<SubscriptionPlan[]> => {
    await delay(DELAYS.NORMAL);
    const defaultPlans: SubscriptionPlan[] = [
      {
        id: "free",
        name: {
          ru: "Пробный",
          en: "Trial",
          kk: "Сынақ"
        },
        price: 0,
        messagesLimit: freePlanSettings.messagesLimit,
        storageLimit: freePlanSettings.storageLimit,
        isFree: true,
        freePeriodDays: freePlanSettings.freePeriodDays,
        features: [
          {
            ru: `Все функции на ${freePlanSettings.freePeriodDays} ${freePlanSettings.freePeriodDays === 1 ? 'день' : freePlanSettings.freePeriodDays < 5 ? 'дня' : 'дней'}`,
            en: `All features for ${freePlanSettings.freePeriodDays} ${freePlanSettings.freePeriodDays === 1 ? 'day' : 'days'}`,
            kk: `Барлық функциялар ${freePlanSettings.freePeriodDays} ${freePlanSettings.freePeriodDays === 1 ? 'күн' : 'күнге'}`
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
    await delay(DELAYS.NORMAL);
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    customPlans.push(newPlan);
    return newPlan;
  },

  getFreePlanSettings: async () => {
    await delay(DELAYS.FAST);
    return freePlanSettings;
  },

  updateFreePlanSettings: async (settings: { messagesLimit: number; storageLimit: number; freePeriodDays: number }): Promise<void> => {
    await delay(DELAYS.NORMAL);
    // Обновляем messagesLimit и freePeriodDays (настраиваются админом), storageLimit остается фиксированным
    freePlanSettings = { 
      ...freePlanSettings, 
      messagesLimit: settings.messagesLimit,
      freePeriodDays: settings.freePeriodDays 
    };
  },
};

// ========== ADMIN SERVICES ==========
export const adminService = {
  getAdmins: async (): Promise<AdminUser[]> => {
    await delay(DELAYS.NORMAL);
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

