/**
 * API сервисы для работы с сообщениями
 * В реальном приложении здесь будут реальные API вызовы
 */

import { Message } from "@/types";
import { API_CONFIG } from "../query/constants";

// Симуляция задержки API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Моковые данные
const mockMessages: Message[] = [
  {
    id: "FB-2024-A7K9X2",
    companyCode: "ACME001",
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
    companyCode: "ACME001",
    type: "praise",
    content: "Отличное командное взаимодействие и поддержка со стороны руководства.",
    status: "В работе",
    createdAt: "2024-03-14",
    updatedAt: "2024-03-14",
  },
  {
    id: "FB-2024-C8N2Z4",
    companyCode: "ACME001",
    type: "suggestion",
    content: "Рассмотрите возможность внедрения гибкого графика работы для повышения удовлетворенности сотрудников.",
    status: "Новое",
    createdAt: "2024-03-14",
    updatedAt: "2024-03-14",
  },
  {
    id: "FB-2024-D1P7X8",
    companyCode: "ACME001",
    type: "complaint",
    content: "Распределение парковочных мест требует пересмотра. Недостаточно мест для всех сотрудников.",
    status: "Решено",
    createdAt: "2024-03-13",
    updatedAt: "2024-03-15",
    companyResponse: "Проблема решена. Добавлены дополнительные парковочные места.",
  },
  {
    id: "FB-2024-E4Q2W6",
    companyCode: "ACME001",
    type: "praise",
    content: "Отличная работа команды разработки. Проекты выполняются в срок и с высоким качеством.",
    status: "Решено",
    createdAt: "2024-03-12",
    updatedAt: "2024-03-12",
  },
  {
    id: "FB-2024-F9R5Y3",
    companyCode: "TECH001",
    type: "suggestion",
    content: "Предлагаю внедрить систему наставничества для новых сотрудников.",
    status: "Новое",
    createdAt: "2024-03-16",
    updatedAt: "2024-03-16",
  },
  {
    id: "FB-2024-G2S8Z7",
    companyCode: "TECH001",
    type: "complaint",
    content: "Недостаточно оборудования для удаленной работы.",
    status: "В работе",
    createdAt: "2024-03-15",
    updatedAt: "2024-03-15",
  },
  {
    id: "FB-2024-H6T1X4",
    companyCode: "GLOB001",
    type: "praise",
    content: "Отличная корпоративная культура и поддержка сотрудников.",
    status: "Решено",
    createdAt: "2024-03-14",
    updatedAt: "2024-03-14",
  },
];

export const messageApi = {
  /**
   * Получить все сообщения или по коду компании
   */
  getAll: async (companyCode?: string): Promise<Message[]> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    if (companyCode) {
      return mockMessages.filter((m) => m.companyCode === companyCode);
    }
    return mockMessages;
  },

  /**
   * Получить сообщение по ID
   */
  getById: async (id: string): Promise<Message | null> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    return mockMessages.find((m) => m.id === id) || null;
  },

  /**
   * Создать новое сообщение
   */
  create: async (message: Omit<Message, "id" | "createdAt" | "updatedAt" | "lastUpdate">): Promise<Message> => {
    await delay(API_CONFIG.TIMEOUT / 2);
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

  /**
   * Обновить сообщение
   */
  update: async (id: string, updates: Partial<Message>): Promise<Message> => {
    await delay(API_CONFIG.TIMEOUT / 3);
    const message = mockMessages.find((m) => m.id === id);
    if (!message) throw new Error("Message not found");
    const now = new Date().toISOString().split("T")[0];
    Object.assign(message, { ...updates, updatedAt: now, lastUpdate: now });
    return message;
  },
};
