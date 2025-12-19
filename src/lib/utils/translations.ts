import { TranslatedString } from "@/types";

/**
 * Получает переведенное значение из строки или объекта с переводами
 * @param value - строка или объект с переводами {ru, en, kk}
 * @returns переведенная строка
 */
export const getTranslatedValue = (value: TranslatedString | undefined): string => {
  if (!value) return "";
  
  // Если это строка, возвращаем как есть
  if (typeof value === "string") {
    return value;
  }
  
  // Если это объект с переводами, возвращаем значение для текущего языка
  // Проверяем доступность i18n только на клиенте
  let currentLang = "ru";
  if (typeof window !== "undefined") {
    try {
      const i18n = require("@/i18n/config").default;
      currentLang = i18n.language || "ru";
    } catch (e) {
      // Fallback to 'ru' if i18n is not available
    }
  }
  
  const langMap: Record<string, "ru" | "en" | "kk"> = {
    ru: "ru",
    en: "en",
    kk: "kk",
  };
  
  const lang = langMap[currentLang] || "ru";
  return value[lang] || value.ru || "";
};

