# Redux модуль

## Использование

### Импорт
```typescript
import { 
  makeStore, 
  useAppDispatch, 
  useAppSelector,
  toggleTheme,
  setTheme,
  type AppStore,
  type AppDispatch,
  type RootState
} from '@/lib/redux';
```

### Использование в компонентах
```typescript
import { useAppDispatch, useAppSelector, toggleTheme } from '@/lib/redux';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  
  return (
    <button onClick={() => dispatch(toggleTheme())}>
      Текущая тема: {theme}
    </button>
  );
};
```

## Структура

- `store.ts` - Redux store конфигурация
- `hooks.ts` - Типизированные хуки
- `slices/uiSlice.ts` - UI слайс (тема)

## Преимущества

1. ✅ Типизированные хуки
2. ✅ Оптимизированные настройки middleware
3. ✅ DevTools только в development

