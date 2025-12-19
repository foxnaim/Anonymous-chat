import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { User, AuthState } from "@/types";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";
import { setToken, getToken, removeToken } from "@/lib/utils/cookies";

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
  User,
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
      
      // Сохраняем токен в куки
      setToken(response.data.token);

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
      return rejectWithValue(apiError.message || "Ошибка регистрации");
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
  async () => {
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
      // Если токен невалиден, удаляем его из куки
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
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        toast.success("Регистрация выполнена успешно");
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload as string || "Ошибка регистрации");
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload as string || "Ошибка входа");
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
      .addCase(checkSessionAsync.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;

