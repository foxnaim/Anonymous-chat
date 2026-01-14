import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { User, AuthState } from "@/types";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";
import { setToken, getToken, removeToken } from "@/lib/utils/cookies";
import i18n from "@/i18n/config";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Async thunk для логина
export const loginAsync = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login({ email, password });
      
      // Сохраняем токен в куки
      setToken(response.data.token);

      // Преобразуем ответ в формат User
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role as User['role'],
        // companyId приходит как строковый ObjectId, оставляем как есть
        companyId: response.data.user.companyId
          ? String(response.data.user.companyId)
          : undefined,
        name: response.data.user.name,
      };

      return user;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || "Неверный email или пароль");
    }
  }
);

// Async thunk для регистрации
export const registerAsync = createAsyncThunk<
  { user: User; verificationToken?: string; token?: string },
  {
    email: string;
    password: string;
    name?: string;
    role?: string;
    companyName?: string;
    companyCode?: string;
  },
  { rejectValue: string }
>(
  'auth/register',
  async ({ email, password, name, role, companyName, companyCode }, { rejectWithValue }) => {
    try {
      const response = await authService.register({
        email,
        password,
        name,
        role,
        companyName,
        companyCode,
      });
      
      // Если есть токен авторизации - сохраняем
      if (response.data.token) {
        setToken(response.data.token);
      }

      // Преобразуем ответ в формат User
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role as User['role'],
        companyId: response.data.user.companyId
          ? String(response.data.user.companyId)
          : undefined,
        name: response.data.user.name,
      };

      return { 
        user, 
        verificationToken: response.data.verificationToken,
        token: response.data.token 
      };
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || "Ошибка регистрации");
    }
  }
);

// Async thunk для подтверждения email
export const verifyEmailAsync = createAsyncThunk<
  User,
  { token: string },
  { rejectValue: string }
>(
  'auth/verifyEmail',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail({ token });
      
      // Сохраняем токен в куки
      setToken(response.data.token);

      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role as User['role'],
        companyId: response.data.user.companyId
          ? String(response.data.user.companyId)
          : undefined,
        name: response.data.user.name,
      };

      return user;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || "Ошибка подтверждения email");
    }
  }
);

// Async thunk для проверки сессии
export const checkSessionAsync = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    if (typeof window === 'undefined') return null;
    
    // Получаем токен из куки
    const token = getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await authService.getMe();
      
      // Преобразуем ответ в формат User
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role as User['role'],
        companyId: response.data.user.companyId
          ? String(response.data.user.companyId)
          : undefined,
        name: response.data.user.name,
      };

      return user;
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError?.message || "";
      
      // Если компания заблокирована, передаем ошибку дальше
      if (errorMessage.includes("COMPANY_BLOCKED") || 
          errorMessage.includes("company blocked") ||
          apiError?.status === 403) {
        return rejectWithValue(errorMessage);
      }
      
      // Если токен невалиден, удаляем его из куки и возвращаем null
      removeToken();
      return null;
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false; // Явно устанавливаем isLoading в false при выходе
      
      // Удаляем токен из куки
      removeToken();
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        toast.success("Вход выполнен успешно");
      })
      // Register
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        // Если вернулся verificationToken, значит нужна верификация, и пользователь НЕ залогинен
        if (action.payload.verificationToken) {
          state.user = null;
          state.isAuthenticated = false;
          // Мы не показываем тост успеха здесь, так как это сделает компонент с отправкой письма
        } else {
          // Стандартная логика (если вдруг verificationToken нет)
          state.user = action.payload.user;
          state.isAuthenticated = true;
          toast.success("Регистрация выполнена успешно");
        }
        state.isLoading = false;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        
        // Получаем сообщение об ошибке
        const backendMessage = String(action.payload || "").trim();
        const msgLower = backendMessage.toLowerCase();
        
        // Маппинг сообщений об ошибках - проверяем в строгом порядке приоритета
        let errorMessage = "";
        
        // 1. Проверка кода компании
        if (backendMessage.includes("Company with this code already exists") || 
            (msgLower.includes("code") && msgLower.includes("already exists") && msgLower.includes("company"))) {
          errorMessage = i18n.t("auth.companyCodeAlreadyExists");
        }
        // 2. Проверка имени компании
        else if (backendMessage.includes("Company with this name already exists") || 
                 (msgLower.includes("name") && msgLower.includes("already exists") && msgLower.includes("company"))) {
          errorMessage = i18n.t("auth.companyNameAlreadyExists");
        }
        // 3. Проверка email компании
        else if (backendMessage.includes("Company with this email already exists") || 
                 (msgLower.includes("email") && msgLower.includes("already exists") && msgLower.includes("company"))) {
          errorMessage = i18n.t("auth.companyEmailAlreadyExists");
        }
        // 4. Проверка email админа
        else if (backendMessage.includes("Admin with this email already exists") || 
                 (msgLower.includes("email") && msgLower.includes("already exists") && msgLower.includes("admin"))) {
          errorMessage = i18n.t("auth.adminEmailAlreadyExists");
        }
        // 5. Проверка email пользователя
        else if (backendMessage.includes("User already exists") || 
                 backendMessage.includes("User with this email already exists") ||
                 (msgLower.includes("user") && msgLower.includes("already exists")) ||
                 (msgLower.includes("email") && msgLower.includes("already exists") && !msgLower.includes("company") && !msgLower.includes("admin"))) {
          errorMessage = i18n.t("auth.userEmailAlreadyExists");
        }
        // 6. Проверка обязательных полей
        else if (backendMessage.includes("Email and password are required") || 
                 msgLower.includes("required")) {
          errorMessage = i18n.t("auth.emailAndPasswordRequired");
        }
        // 7. Проверка длины пароля
        else if (backendMessage.includes("Password must be at least")) {
          errorMessage = i18n.t("auth.passwordMinLength", { length: 8 });
        }
        // 8. Общая ошибка конфликта
        else if (action.meta.requestStatus === "rejected" && !backendMessage) {
          errorMessage = i18n.t("common.error");
        }
        // 9. Если есть сообщение, но оно не распознано
        else if (backendMessage && !backendMessage.includes("HTTP error")) {
          errorMessage = i18n.t("auth.companyConflictError") || backendMessage;
        }
        // 10. Общая ошибка
        else {
          errorMessage = i18n.t("auth.registrationError");
        }
        
        toast.error(errorMessage);
      })
      // Verify Email
      .addCase(verifyEmailAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyEmailAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        toast.success("Email успешно подтвержден");
      })
      .addCase(verifyEmailAsync.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload as string || "Ошибка подтверждения email");
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        
        // Получаем сообщение об ошибке
        const backendMessage = String(action.payload || "").trim();
        const msgLower = backendMessage.toLowerCase();
        
        // Маппинг сообщений об ошибках - проверяем в строгом порядке приоритета
        let errorMessage = "";
        
        // 1. Проверка обязательных полей
        if (backendMessage.includes("Email and password are required") || 
            msgLower.includes("required")) {
          errorMessage = "Email и пароль обязательны. Пожалуйста, заполните все поля.";
        }
        // 2. Проверка заблокированной компании
        else if (backendMessage.includes("COMPANY_BLOCKED") || 
                 backendMessage.includes("company blocked")) {
          errorMessage = "Компания заблокирована администратором. Свяжитесь с нами по почте.";
        }
        // 3. Проверка неверных учетных данных
        else if (backendMessage.includes("Invalid email or password") || 
                 backendMessage.includes("invalid") || 
                 backendMessage.includes("incorrect")) {
          errorMessage = "Неверный email или пароль";
        }
        // 4. Проверка необходимости подтверждения email
        else if (backendMessage.includes("Please verify your email address before logging in") ||
                 backendMessage.includes("verify your email") ||
                 (msgLower.includes("verify") && msgLower.includes("email") && msgLower.includes("before"))) {
          errorMessage = i18n.t("auth.verifyEmailBeforeLogin");
        }
        // 5. Если есть сообщение, показываем его
        else if (backendMessage && !backendMessage.includes("HTTP error")) {
          errorMessage = backendMessage;
        }
        // 5. Общая ошибка
        else {
          errorMessage = "Ошибка входа";
        }
        
        toast.error(errorMessage);
      })
      // Check Session
      .addCase(checkSessionAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSessionAsync.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isLoading = false;
      })
      .addCase(checkSessionAsync.rejected, (state, action) => {
        // Проверяем, является ли ошибка блокировкой компании
        const errorMessage = String(action.payload || action.error?.message || "").trim();
        if (errorMessage.includes("COMPANY_BLOCKED") || 
            errorMessage.includes("company blocked")) {
          toast.error("Компания заблокирована администратором. Свяжитесь с нами по почте.");
        }
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;

