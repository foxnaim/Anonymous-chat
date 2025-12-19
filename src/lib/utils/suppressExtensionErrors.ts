/**
 * Утилита для подавления ошибок Chrome-расширений в консоли
 * Фильтрует ошибки, связанные с расширениями браузера
 * 
 * ВАЖНО: Ошибки в Network tab DevTools нельзя скрыть через JavaScript.
 * Используйте фильтр в Network tab: -chrome-extension://
 */

if (typeof window !== 'undefined') {
  // Список ID расширений, ошибки которых нужно подавить
  const EXTENSION_IDS_TO_SUPPRESS = [
    'pejdijmoenmkgeppbflobdenhhabjlaj', // Проблемное расширение
  ];

  // Проверка, является ли ошибка связанной с расширением
  const isExtensionError = (message: string, source?: string, ...allArgs: unknown[]): boolean => {
    const fullText = [
      message,
      source,
      ...allArgs.map(arg => String(arg))
    ].join(' ').toLowerCase();

    // Проверка по chrome-extension://
    if (fullText.includes('chrome-extension://')) {
      return true;
    }

    // Проверка по content_script.js (расширения часто используют этот файл)
    if (fullText.includes('content_script.js')) {
      return true;
    }

    // Проверка по completion_list.html (расширения автодополнения)
    if (fullText.includes('completion_list.html')) {
      return true;
    }

    // Проверка по utils.js, extensionState.js, heuristicsRedefinitions.js
    if (fullText.includes('utils.js') || 
        fullText.includes('extensionstate.js') || 
        fullText.includes('heuristicsredefinitions.js')) {
      return true;
    }

    // Проверка по ERR_FILE_NOT_FOUND для расширений
    if (fullText.includes('err_file_not_found') && fullText.includes('extension')) {
      return true;
    }

    // Проверка по конкретным ID расширений
    return EXTENSION_IDS_TO_SUPPRESS.some(id => fullText.includes(id));
  };

  // Сохраняем оригинальные методы консоли
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;

  // Перехватываем console.error
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    const source = args[1]?.toString() || '';

    // Пропускаем ошибки расширений
    if (isExtensionError(message, source, ...args)) {
      return; // Не выводим ошибку
    }

    // Выводим все остальные ошибки
    originalError.apply(console, args);
  };

  // Перехватываем console.warn (на случай, если расширение использует warn)
  console.warn = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    const source = args[1]?.toString() || '';

    // Пропускаем предупреждения расширений
    if (isExtensionError(message, source, ...args)) {
      return; // Не выводим предупреждение
    }

    // Выводим все остальные предупреждения
    originalWarn.apply(console, args);
  };

  // Перехватываем console.log (на случай, если расширение использует log для ошибок)
  console.log = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    const source = args[1]?.toString() || '';

    // Пропускаем логи расширений
    if (isExtensionError(message, source, ...args)) {
      return; // Не выводим лог
    }

    // Выводим все остальные логи
    originalLog.apply(console, args);
  };

  // Перехватываем console.info
  console.info = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    const source = args[1]?.toString() || '';

    // Пропускаем инфо расширений
    if (isExtensionError(message, source, ...args)) {
      return; // Не выводим инфо
    }

    // Выводим все остальные инфо
    originalInfo.apply(console, args);
  };

  // Перехватываем глобальные ошибки
  const originalOnError = window.onerror;
  window.onerror = (
    message?: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ) => {
    const messageStr = typeof message === 'string' ? message : message?.toString() || '';
    
    // Пропускаем ошибки расширений
    if (isExtensionError(messageStr, source)) {
      return true; // Предотвращаем вывод ошибки
    }

    // Вызываем оригинальный обработчик для остальных ошибок
    if (originalOnError && message !== undefined) {
      return originalOnError(message, source, lineno, colno, error);
    }

    return false;
  };

  // Перехватываем необработанные промисы (unhandledrejection)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.toString() || '';
    const stack = reason?.stack || '';

    // Пропускаем ошибки расширений
    if (isExtensionError(message, stack)) {
      event.preventDefault(); // Предотвращаем вывод ошибки
      return;
    }
  }, true); // Используем capture phase для раннего перехвата

  // Перехватываем fetch для подавления ошибок в консоли (но не в Network tab)
  const originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    let url = '';
    if (typeof args[0] === 'string') {
      url = args[0];
    } else if (args[0] instanceof Request) {
      url = args[0].url;
    } else if (args[0] instanceof URL) {
      url = args[0].href;
    }
    
    // Блокируем запросы к расширениям (опционально, может сломать расширение)
    // Раскомментируйте, если хотите полностью блокировать запросы:
    // if (url.includes('chrome-extension://')) {
    //   return Promise.reject(new Error('Blocked extension request'));
    // }

    try {
      return await originalFetch.apply(window, args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Подавляем ошибки расширений в консоли
      if (isExtensionError(errorMessage, url)) {
        // Создаем "тихую" ошибку, которая не будет выводиться
        const silentError = new Error('Extension error suppressed');
        (silentError as any).suppressed = true;
        throw silentError;
      }
      throw error;
    }
  };
}

