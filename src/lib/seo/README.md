# SEO модуль

Централизованный модуль для SEO оптимизации приложения.

## Структура

```
lib/seo/
├── components/          # SEO React компоненты
│   ├── SEO.tsx         # Основной SEO компонент
│   └── SeoHead.tsx     # Компонент для next-seo
├── defaultSeo.ts       # Конфигурация по умолчанию
├── index.ts            # Экспорты
└── README.md           # Документация
```

## Использование

### Импорт компонентов
```typescript
import { SEO, SeoHead, WebsiteStructuredData, OrganizationStructuredData } from '@/lib/seo';
```

### Использование в компонентах
```typescript
import { SEO } from '@/lib/seo';

const MyPage = () => {
  return (
    <>
      <SEO 
        title="Моя страница"
        description="Описание страницы"
        keywords="ключевые, слова"
      />
      {/* Контент страницы */}
    </>
  );
};
```

### Использование в layout
```typescript
import { SeoHead } from '@/lib/seo';

export default function Layout({ children }) {
  return (
    <>
      <SeoHead />
      {children}
    </>
  );
}
```

### Structured Data
```typescript
import { WebsiteStructuredData, OrganizationStructuredData } from '@/lib/seo';

const HomePage = () => (
  <>
    <WebsiteStructuredData />
    <OrganizationStructuredData />
  </>
);
```

### Утилиты
```typescript
import { seoUtils } from '@/lib/seo';

// Генерация полного title
const title = seoUtils.getFullTitle('Заголовок'); 
// "Заголовок | FeedbackHub"

// Генерация canonical URL
const canonical = seoUtils.getCanonicalUrl('/page');
// "https://feedbackhub.com/page"

// Генерация OG изображения
const ogImage = seoUtils.getOgImageUrl('/og-page.png');
// "https://feedbackhub.com/og-page.png"
```

## Преимущества

1. ✅ Все SEO логика в одном месте
2. ✅ Использует константы из `APP_CONFIG`
3. ✅ Типизированные компоненты
4. ✅ Поддержка многоязычности
5. ✅ Structured Data (JSON-LD)
6. ✅ Open Graph и Twitter Cards
