/**
 * Сжимает и изменяет размер изображения
 * @param file - Файл изображения
 * @param maxWidth - Максимальная ширина (по умолчанию 200px)
 * @param maxHeight - Максимальная высота (по умолчанию 200px)
 * @param quality - Качество JPEG (0-1, по умолчанию 0.8)
 * @param maxSizeKB - Максимальный размер в KB (по умолчанию 500KB)
 * @returns Promise с base64 строкой
 */
export async function compressImage(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8,
  maxSizeKB: number = 500
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Создаем canvas для обработки
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Не удалось создать контекст canvas'));
          return;
        }
        
        // Рисуем изображение на canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в base64 с компрессией
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Если размер все еще слишком большой, уменьшаем качество
        const checkSize = () => {
          const base64Size = (compressedBase64.length * 3) / 4; // Примерный размер в байтах
          const sizeKB = base64Size / 1024;
          
          if (sizeKB > maxSizeKB && quality > 0.1) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            checkSize();
          } else {
            resolve(compressedBase64);
          }
        };
        
        checkSize();
      };
      
      img.onerror = () => {
        reject(new Error('Ошибка загрузки изображения'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Проверяет размер файла
 * @param file - Файл для проверки
 * @param maxSizeMB - Максимальный размер в MB
 * @returns true если файл не превышает лимит
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Проверяет тип файла
 * @param file - Файл для проверки
 * @returns true если файл является изображением
 */
export function validateImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

