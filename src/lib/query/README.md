# React Query модуль

## Использование

### Базовое использование
```typescript
import { makeQueryClient, queryKeys } from '@/lib/query';
```

### Кастомные хуки
```typescript
import { 
  useMessages, 
  useMessage, 
  useCompanies, 
  useCompany,
  useCompanyStats,
  useCreateMessage,
  useUpdateMessageStatus
} from '@/lib/query';

// Использование
const { data: messages, isLoading } = useMessages(companyCode);
const { data: message } = useMessage(messageId);
const { data: companies } = useCompanies();
const { mutate: createMessage } = useCreateMessage();
```

### Query Keys
Все query keys централизованы в `queryKeys`:
```typescript
import { queryKeys } from '@/lib/query';

// Использование в invalidateQueries
queryClient.invalidateQueries({ queryKey: queryKeys.messages(companyCode) });
```

## Преимущества

1. ✅ Типизированные хуки
2. ✅ Централизованные query keys
3. ✅ Автоматическая инвалидация кэша
4. ✅ Оптимизированные настройки по умолчанию

