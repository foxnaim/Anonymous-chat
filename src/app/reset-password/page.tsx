'use client';

import { useState, useEffect, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";
import { motion } from "framer-motion";

const ResetPasswordContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Получаем токен из query параметра
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Токен восстановления не найден. Пожалуйста, используйте ссылку из email.");
      return;
    }

    // Проверка надежности пароля
    const { validatePasswordStrength } = await import("@/lib/utils/validation");
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      // Показываем первую ошибку
      const firstError = passwordValidation.errors[0];
      toast.error(firstError || t("auth.passwordWeak"));
      return;
    }

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({ token, password });
      toast.success("Пароль успешно изменен!");
      
      // Перенаправляем на главную страницу (используем requestIdleCallback для неблокирующего редиректа)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          router.push("/");
        }, { timeout: 1500 });
      } else {
        // Fallback для браузеров без requestIdleCallback
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (error) {
      setIsLoading(false);
      const apiError = error as ApiError;
      toast.error(apiError.message || "Ошибка при сбросе пароля");
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
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FiLock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2" suppressHydrationWarning>
                Сброс пароля
              </h1>
              <p className="text-muted-foreground" suppressHydrationWarning>
                Введите новый пароль для вашего аккаунта
              </p>
            </div>
          </div>

          {!token ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Токен восстановления не найден. Пожалуйста, используйте ссылку из email.
              </p>
              <Button asChild variant="outline">
                <Link href="/">Вернуться к входу</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FiEye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirmPassword")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FiEye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <FiLock className="mr-2 h-5 w-5" />
                {isLoading ? t("common.loading") : "Сбросить пароль"}
              </Button>

              <div className="text-center text-sm">
                <Link href="/" className="text-primary hover:underline">
                  Вернуться к входу
                </Link>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

const ResetPassword = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPassword;

