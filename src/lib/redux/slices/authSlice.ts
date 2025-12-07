import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { User, AuthState } from "@/types";
import { toast } from "sonner";
import { STORAGE_KEYS } from "../constants";

// Моковые пользователи для демо
const mockUsers = {
  company: {
    id: "1",
    email: "admin@acme.com",
    role: "company" as const,
    companyId: 1,
    name: "Acme Corporation Admin",
  },
  admin: {
    id: "admin-1",
    email: "admin@feedbackhub.com",
    role: "super_admin" as const,
    name: "Super Admin",
  },
};

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
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Проверка моковых пользователей
    if (email === mockUsers.company.email && password === "password") {
      return mockUsers.company;
    }
    if (email === mockUsers.admin.email && password === "admin") {
      return mockUsers.admin;
    }
    
    return rejectWithValue("Неверный email или пароль");
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
    
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User;
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }
    }
    return null;
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.PASSWORD);
      }
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
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
        }
        toast.success("Вход выполнен успешно");
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

