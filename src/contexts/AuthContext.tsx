'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthState } from "@/types";
import { toast } from "sonner";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    role: "admin" as const,
    name: "Super Admin",
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненную сессию
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem("feedbackhub_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem("feedbackhub_user");
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (typeof window === 'undefined') {
      setIsLoading(false);
      return false;
    }

    // Проверяем сохраненного пользователя из localStorage (для зарегистрированных компаний)
    const savedUser = localStorage.getItem("feedbackhub_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const savedPassword = localStorage.getItem(`feedbackhub_password_${user.email}`);
        
        if (user.email === email && savedPassword === password) {
          setUser(user);
          setIsLoading(false);
          toast.success("Успешный вход!");
          return true;
        }
      } catch (e) {
        // Игнорируем ошибку парсинга
      }
    }

    // Проверяем моковых пользователей (демо доступ)
    // Админ
    if (email === mockUsers.admin.email && password === "password") {
      setUser(mockUsers.admin);
      localStorage.setItem("feedbackhub_user", JSON.stringify(mockUsers.admin));
      setIsLoading(false);
      toast.success("Успешный вход!");
      return true;
    }

    // Компания (демо)
    if (email === mockUsers.company.email && password === "password") {
      setUser(mockUsers.company);
      localStorage.setItem("feedbackhub_user", JSON.stringify(mockUsers.company));
      setIsLoading(false);
      toast.success("Успешный вход!");
      return true;
    }

    setIsLoading(false);
    toast.error("Неверный email или пароль");
    return false;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem("feedbackhub_user");
    }
    toast.success("Вы вышли из системы");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

