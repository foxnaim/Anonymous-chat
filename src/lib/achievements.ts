/**
 * Система достижений для компаний
 * Достижения организованы по уровням внутри каждой категории
 */

import type { Achievement, AchievementProgress, Message, Company, MessageStatus } from "@/types";
import { MESSAGE_STATUSES } from "./utils/constants";

/**
 * Структура уровней для каждой категории достижений
 */
export interface AchievementLevel {
  level: number;
  target: number;
  titleKey: string;
  descriptionKey: string;
}

// Определение уровней для каждой категории
const REVIEWS_LEVELS: AchievementLevel[] = [
  { level: 1, target: 10, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 2, target: 25, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 3, target: 50, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 4, target: 100, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 5, target: 250, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 6, target: 500, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 7, target: 1000, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 8, target: 2500, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 9, target: 5000, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
  { level: 10, target: 10000, titleKey: "company.achievement.reviews.level", descriptionKey: "company.achievement.reviews.description" },
];

const RESOLVED_LEVELS: AchievementLevel[] = [
  { level: 1, target: 10, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 2, target: 25, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 3, target: 50, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 4, target: 100, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 5, target: 250, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 6, target: 500, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 7, target: 1000, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 8, target: 2500, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 9, target: 5000, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
  { level: 10, target: 10000, titleKey: "company.achievement.resolved.level", descriptionKey: "company.achievement.resolved.description" },
];

const RESPONSE_SPEED_LEVELS: AchievementLevel[] = [
  { level: 1, target: 10, titleKey: "company.achievement.responseSpeed.level", descriptionKey: "company.achievement.responseSpeed.description" },
  { level: 2, target: 25, titleKey: "company.achievement.responseSpeed.level", descriptionKey: "company.achievement.responseSpeed.description" },
  { level: 3, target: 50, titleKey: "company.achievement.responseSpeed.level", descriptionKey: "company.achievement.responseSpeed.description" },
  { level: 4, target: 100, titleKey: "company.achievement.responseSpeed.level", descriptionKey: "company.achievement.responseSpeed.description" },
  { level: 5, target: 250, titleKey: "company.achievement.responseSpeed.level", descriptionKey: "company.achievement.responseSpeed.description" },
  { level: 6, target: 500, titleKey: "company.achievement.responseSpeed.level", descriptionKey: "company.achievement.responseSpeed.description" },
];

const ACTIVITY_LEVELS: AchievementLevel[] = [
  { level: 1, target: 1, titleKey: "company.achievement.activity.week", descriptionKey: "company.achievement.activity.week.description" },
  { level: 2, target: 1, titleKey: "company.achievement.activity.month", descriptionKey: "company.achievement.activity.month.description" },
  { level: 3, target: 1, titleKey: "company.achievement.activity.noComplaintsMonth", descriptionKey: "company.achievement.activity.noComplaintsMonth.description" },
  { level: 4, target: 3, titleKey: "company.achievement.activity.consistent", descriptionKey: "company.achievement.activity.consistent.description" },
];

const QUALITY_LEVELS: AchievementLevel[] = [
  { level: 1, target: 20, titleKey: "company.achievement.quality.manyPraises", descriptionKey: "company.achievement.quality.manyPraises.description" },
  { level: 2, target: 50, titleKey: "company.achievement.quality.manyPraises", descriptionKey: "company.achievement.quality.manyPraises.description" },
  { level: 3, target: 100, titleKey: "company.achievement.quality.manyPraises", descriptionKey: "company.achievement.quality.manyPraises.description" },
  { level: 4, target: 50, titleKey: "company.achievement.quality.positiveRatio", descriptionKey: "company.achievement.quality.positiveRatio.description" },
  { level: 5, target: 70, titleKey: "company.achievement.quality.positiveRatio", descriptionKey: "company.achievement.quality.positiveRatio.description" },
  { level: 6, target: 80, titleKey: "company.achievement.quality.highResolution", descriptionKey: "company.achievement.quality.highResolution.description" },
  { level: 7, target: 90, titleKey: "company.achievement.quality.excellentResolution", descriptionKey: "company.achievement.quality.excellentResolution.description" },
];

const LONGEVITY_LEVELS: AchievementLevel[] = [
  { level: 1, target: 3, titleKey: "company.achievement.longevity.level", descriptionKey: "company.achievement.longevity.description" },
  { level: 2, target: 6, titleKey: "company.achievement.longevity.level", descriptionKey: "company.achievement.longevity.description" },
  { level: 3, target: 12, titleKey: "company.achievement.longevity.level", descriptionKey: "company.achievement.longevity.description" },
  { level: 4, target: 24, titleKey: "company.achievement.longevity.level", descriptionKey: "company.achievement.longevity.description" },
  { level: 5, target: 36, titleKey: "company.achievement.longevity.level", descriptionKey: "company.achievement.longevity.description" },
];

/**
 * Создание достижений из уровней
 */
function createAchievementsFromLevels(
  category: Achievement["category"],
  levels: AchievementLevel[],
  baseOrder: number
): Achievement[] {
  return levels.map((level, index) => ({
    id: `${category}_level_${level.level}`,
    category,
    titleKey: level.titleKey,
    descriptionKey: level.descriptionKey,
    target: level.target,
    order: baseOrder + index,
    level: level.level,
  }));
}

// Генерация всех достижений
export const ACHIEVEMENTS: Achievement[] = [
  ...createAchievementsFromLevels("reviews", REVIEWS_LEVELS, 1),
  ...createAchievementsFromLevels("resolved", RESOLVED_LEVELS, 100),
  ...createAchievementsFromLevels("response_speed", RESPONSE_SPEED_LEVELS, 200),
  ...createAchievementsFromLevels("activity", ACTIVITY_LEVELS, 300),
  ...createAchievementsFromLevels("quality", QUALITY_LEVELS, 400),
  ...createAchievementsFromLevels("longevity", LONGEVITY_LEVELS, 500),
];

/**
 * Интерфейс для данных компании для расчета достижений
 */
interface CompanyAchievementData {
  totalMessages: number;
  resolvedMessages: number;
  messages: Message[];
  company: Company;
  responseSpeedStats: {
    fast: number; // Ответы в течение 1 дня
    medium: number; // Ответы в течение 3 дней
    normal: number; // Ответы в течение 7 дней
  };
  activityStats: {
    messagesThisMonth: number;
    messagesLastMonth: number;
    messagesTwoMonthsAgo: number;
    complaintsThisMonth: number;
    complaintsLastMonth: number;
  };
  qualityStats: {
    resolutionRate: number; // Процент решенных проблем
    praisesCount: number;
    positiveRatio: number; // Процент положительных отзывов
  };
  longevityMonths: number; // Количество месяцев с момента регистрации
}

/**
 * Расчет статистики для достижений
 */
function calculateCompanyStats(
  messages: Message[],
  company: Company
): CompanyAchievementData {
  const now = new Date();
  const totalMessages = messages.length;
  const resolvedStatus: MessageStatus = "Решено";
  const resolvedMessages = messages.filter((m) => m.status === resolvedStatus).length;

  // Расчет скорости ответа
  let fast = 0; // В течение 1 дня
  let medium = 0; // В течение 3 дней
  let normal = 0; // В течение 7 дней

  messages.forEach((msg) => {
    if (msg.companyResponse && msg.updatedAt) {
      const created = new Date(msg.createdAt);
      const updated = new Date(msg.updatedAt);
      const daysDiff = Math.floor(
        (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 1) fast++;
      else if (daysDiff <= 3) medium++;
      else if (daysDiff <= 7) normal++;
    }
  });

  // Расчет активности
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const messagesThisMonth = messages.filter(
    (m) => new Date(m.createdAt) >= thisMonth
  ).length;
  const messagesLastMonth = messages.filter(
    (m) =>
      new Date(m.createdAt) >= lastMonth && new Date(m.createdAt) < thisMonth
  ).length;
  const messagesTwoMonthsAgo = messages.filter(
    (m) =>
      new Date(m.createdAt) >= twoMonthsAgo &&
      new Date(m.createdAt) < lastMonth
  ).length;

  const complaintsThisMonth = messages.filter(
    (m) =>
      m.type === "complaint" && new Date(m.createdAt) >= thisMonth
  ).length;
  const complaintsLastMonth = messages.filter(
    (m) =>
      m.type === "complaint" &&
      new Date(m.createdAt) >= lastMonth &&
      new Date(m.createdAt) < thisMonth
  ).length;

  // Расчет качества
  const complaints = messages.filter((m) => m.type === "complaint").length;
  const resolvedComplaints = messages.filter(
    (m) => m.type === "complaint" && m.status === resolvedStatus
  ).length;
  const resolutionRate =
    complaints > 0 ? Math.round((resolvedComplaints / complaints) * 100) : 0;

  const praisesCount = messages.filter((m) => m.type === "praise").length;
  const suggestions = messages.filter((m) => m.type === "suggestion").length;
  const positiveRatio =
    totalMessages > 0
      ? Math.round(((praisesCount + suggestions) / totalMessages) * 100)
      : 0;

  // Расчет долгосрочности
  const registeredDate = new Date(company.registered);
  const monthsDiff =
    (now.getFullYear() - registeredDate.getFullYear()) * 12 +
    (now.getMonth() - registeredDate.getMonth());
  const longevityMonths = Math.max(0, monthsDiff);

  return {
    totalMessages,
    resolvedMessages,
    messages,
    company,
    responseSpeedStats: {
      fast,
      medium,
      normal,
    },
    activityStats: {
      messagesThisMonth,
      messagesLastMonth,
      messagesTwoMonthsAgo,
      complaintsThisMonth,
      complaintsLastMonth,
    },
    qualityStats: {
      resolutionRate,
      praisesCount,
      positiveRatio,
    },
    longevityMonths,
  };
}

/**
 * Расчет прогресса для конкретного достижения
 */
function calculateAchievementProgress(
  achievement: Achievement,
  data: CompanyAchievementData
): AchievementProgress {
  let current = 0;
  let completed = false;

  switch (achievement.category) {
    case "reviews":
      current = data.totalMessages;
      completed = current >= achievement.target;
      break;

    case "resolved":
      current = data.resolvedMessages;
      completed = current >= achievement.target;
      break;

    case "response_speed":
      // Для скорости ответа считаем быстрые ответы (в течение 1 дня)
      current = data.responseSpeedStats.fast;
      completed = current >= achievement.target;
      break;

    case "activity":
      if (achievement.id === "activity_level_1") {
        // Неделя активности (минимум 5 сообщений на неделе)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const messagesThisWeek = data.messages.filter(
          (m) => new Date(m.createdAt) >= weekAgo
        ).length;
        current = messagesThisWeek >= 5 ? 1 : 0;
        completed = current >= achievement.target;
      } else if (achievement.id === "activity_level_2") {
        // Месяц активности (минимум 10 сообщений)
        current = data.activityStats.messagesThisMonth >= 10 ? 1 : 0;
        completed = current >= achievement.target;
      } else if (achievement.id === "activity_level_3") {
        // Месяц без жалоб
        current = data.activityStats.complaintsThisMonth === 0 ? 1 : 0;
        completed = current >= achievement.target;
      } else if (achievement.id === "activity_level_4") {
        // 3 месяца подряд с активностью (минимум 5 сообщений в месяц)
        const hasThisMonth = data.activityStats.messagesThisMonth >= 5;
        const hasLastMonth = data.activityStats.messagesLastMonth >= 5;
        const hasTwoMonthsAgo = data.activityStats.messagesTwoMonthsAgo >= 5;
        current = hasThisMonth && hasLastMonth && hasTwoMonthsAgo ? 3 : 0;
        completed = current >= achievement.target;
      }
      break;

    case "quality":
      if (achievement.id?.startsWith("quality_level_1") || achievement.id?.startsWith("quality_level_2") || achievement.id?.startsWith("quality_level_3")) {
        // Много похвал
        current = data.qualityStats.praisesCount;
        completed = current >= achievement.target;
      } else if (achievement.id?.startsWith("quality_level_4") || achievement.id?.startsWith("quality_level_5")) {
        // Позитивная обратная связь
        current = data.qualityStats.positiveRatio;
        completed = current >= achievement.target;
      } else if (achievement.id?.startsWith("quality_level_6")) {
        // Высокий процент решения
        current = data.qualityStats.resolutionRate;
        completed = current >= achievement.target;
      } else if (achievement.id?.startsWith("quality_level_7")) {
        // Отличный процент решения
        current = data.qualityStats.resolutionRate;
        completed = current >= achievement.target;
      }
      break;

    case "longevity":
      current = data.longevityMonths;
      completed = current >= achievement.target;
      break;
  }

  // Расчет прогресса в процентах
  const progress = completed
    ? 100
    : achievement.target > 0
    ? Math.min(100, Math.round((current / achievement.target) * 100))
    : 0;

  return {
    achievement,
    current,
    progress,
    completed,
    completedAt: completed ? new Date().toISOString().split("T")[0] : undefined,
  };
}

/**
 * Группировка достижений по категориям
 */
export type GroupedAchievements = {
  category: Achievement["category"];
  categoryTitleKey: string;
  achievements: AchievementProgress[];
  currentLevel: number; // Текущий уровень в этой категории
  maxLevel: number; // Максимальный уровень в этой категории
}

/**
 * Получить достижения сгруппированные по категориям
 */
export function getGroupedAchievements(
  messages: Message[],
  company: Company
): GroupedAchievements[] {
  const stats = calculateCompanyStats(messages, company);
  const allProgress = ACHIEVEMENTS.map((achievement) =>
    calculateAchievementProgress(achievement, stats)
  );

  // Группировка по категориям
  const grouped: Record<string, AchievementProgress[]> = {};
  allProgress.forEach((progress) => {
    const category = progress.achievement.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(progress);
  });

  // Преобразование в массив с метаданными
  const categoryTitles: Record<string, string> = {
    reviews: "company.achievement.category.reviews",
    resolved: "company.achievement.category.resolved",
    response_speed: "company.achievement.category.responseSpeed",
    activity: "company.achievement.category.activity",
    quality: "company.achievement.category.quality",
    longevity: "company.achievement.category.longevity",
  };

  return Object.entries(grouped).map(([category, achievements]) => {
    // Сортируем по уровню
    achievements.sort((a, b) => {
      const levelA = (a.achievement as any).level || 0;
      const levelB = (b.achievement as any).level || 0;
      return levelA - levelB;
    });

    // Находим текущий уровень (последний завершенный + 1)
    let currentLevel = 0;
    for (const ach of achievements) {
      if (ach.completed) {
        currentLevel = Math.max(currentLevel, (ach.achievement as any).level || 0);
      }
    }
    // Если есть незавершенное достижение, показываем его уровень
    const nextIncomplete = achievements.find((a) => !a.completed);
    if (nextIncomplete) {
      currentLevel = Math.max(currentLevel, ((nextIncomplete.achievement as any).level || 1) - 1);
    }

    const maxLevel = Math.max(...achievements.map((a) => (a.achievement as any).level || 0));

    return {
      category: category as Achievement["category"],
      categoryTitleKey: categoryTitles[category] || category,
      achievements,
      currentLevel,
      maxLevel,
    };
  }).sort((a, b) => {
    // Сортируем категории: сначала с прогрессом, потом остальные
    const aHasProgress = a.achievements.some((ach) => ach.progress > 0);
    const bHasProgress = b.achievements.some((ach) => ach.progress > 0);
    if (aHasProgress !== bHasProgress) {
      return aHasProgress ? -1 : 1;
    }
    return a.category.localeCompare(b.category);
  });
}

/**
 * Получить все достижения с прогрессом для компании (для обратной совместимости)
 */
export function getCompanyAchievements(
  messages: Message[],
  company: Company
): AchievementProgress[] {
  const stats = calculateCompanyStats(messages, company);
  
  return ACHIEVEMENTS.map((achievement) =>
    calculateAchievementProgress(achievement, stats)
  ).sort((a, b) => {
    // Сначала завершенные, потом по прогрессу, потом по порядку
    if (a.completed !== b.completed) {
      return a.completed ? -1 : 1;
    }
    if (a.progress !== b.progress) {
      return b.progress - a.progress;
    }
    return a.achievement.order - b.achievement.order;
  });
}

/**
 * Получить достижения по категории
 */
export function getAchievementsByCategory(
  category: Achievement["category"]
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
