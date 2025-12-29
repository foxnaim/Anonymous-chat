/**
 * Утилиты для работы с куки
 */

const TOKEN_COOKIE_NAME = 'feedbackhub_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 дней в секундах

/**
 * Устанавливает куки
 */
export const setCookie = (name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void => {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + maxAge * 1000);
  
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

/**
 * Получает значение куки
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  
  return null;
};

/**
 * Удаляет куки
 */
export const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  
  // Удаляем куку с разными вариантами настроек для надежности
  const domain = window.location.hostname;
  const paths = ['/', ''];
  const domains = [domain, `.${domain}`, ''];
  
  paths.forEach(path => {
    domains.forEach(dom => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${dom}; SameSite=Lax`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${dom}; SameSite=None; Secure`;
    });
  });
};

/**
 * Сохраняет токен в куки
 */
export const setToken = (token: string): void => {
  setCookie(TOKEN_COOKIE_NAME, token);
};

/**
 * Получает токен из куки
 */
export const getToken = (): string | null => {
  return getCookie(TOKEN_COOKIE_NAME);
};

/**
 * Удаляет токен из куки
 */
export const removeToken = (): void => {
  deleteCookie(TOKEN_COOKIE_NAME);
};

