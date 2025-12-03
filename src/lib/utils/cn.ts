import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Утилита для объединения классов с поддержкой Tailwind
 * Использует clsx для условных классов и tailwind-merge для разрешения конфликтов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
