'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/redux";
import { FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";
const Login = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      setIsLoading(false);
      if (result.success && result.user) {
        // Используем пользователя из результата логина для определения роли
        const from = searchParams?.get('from');
        if (from) {
          router.replace(from as any);
        } else {
          if (result.user.role === "admin" || result.user.role === "super_admin") {
            router.replace("/admin");
          } else if (result.user.role === "company") {
            router.replace("/company");
          } else {
            router.replace("/");
          }
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      // apiClient выбрасывает ApiError: { message: string, status: number, code?: string }
      const backendMessage = String(error?.message || "").trim();
      const errorStatus = error?.status || 0;
      
      // Маппинг сообщений об ошибках - проверяем в строгом порядке приоритета
      let errorMessage = "";
      const msgLower = backendMessage.toLowerCase();
      
      // 1. Проверка обязательных полей
      if (backendMessage.includes("Email and password are required") || 
          msgLower.includes("required")) {
        errorMessage = t("auth.emailAndPasswordRequired");
      }
      // 2. Проверка заблокированной компании
      else if (backendMessage.includes("COMPANY_BLOCKED") || 
               backendMessage.includes("company blocked") ||
               errorStatus === 403) {
        errorMessage = "Компания заблокирована администратором. Подробности будут отправлены по почте.";
      }
      // 3. Проверка неверных учетных данных
      else if (backendMessage.includes("Invalid email or password") || 
               backendMessage.includes("invalid") || 
               backendMessage.includes("incorrect") ||
               errorStatus === 401) {
        errorMessage = t("auth.loginError");
      }
      // 4. Если есть сообщение, показываем его
      else if (backendMessage && !backendMessage.includes("HTTP error")) {
        errorMessage = backendMessage;
      }
      // 5. Общая ошибка
      else {
        errorMessage = t("auth.loginError");
      }
      
      // Показываем toast с ошибкой
      toast.error(errorMessage);
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <FiArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Link>
            <div className="text-center">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/feedBack.svg"
                  alt="Anonymous Chat"
                  width={48}
                  height={48}
                  priority
                  className="h-12 w-12 mx-auto"
                />
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">FeedbackHub</h1>
              <p className="text-muted-foreground">{t("auth.login")}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-1">Демо доступ:</p>
              <p>Email: admin@acme.com (компания)</p>
              <p>Email: admin@feedbackhub.com (админ)</p>
              <p>Пароль: password</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.login")}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("auth.noAccount")}</span>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
export default Login;
