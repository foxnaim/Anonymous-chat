'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiArrowLeft } from "react-icons/fi";
import { useCreateCompany, plansService } from "@/lib/query";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Register = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { mutate: registerCompany, isPending } = useCreateCompany({
    onSuccess: async (company) => {
      toast.success(t("auth.registerSuccess"));
      
      // Автоматически входим в систему
      const loginSuccess = await login(formData.email, formData.password);
      
      if (loginSuccess) {
        // Перенаправляем в панель компании (используем requestAnimationFrame для неблокирующего редиректа)
        requestAnimationFrame(() => {
          router.replace("/company");
        });
      } else {
        router.replace("/company");
      }
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : t("common.error");
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    // Проверка надежности пароля
    const { validatePasswordStrength } = await import("@/lib/utils/validation");
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      // Показываем первую ошибку
      const firstError = passwordValidation.errors[0];
      toast.error(firstError || t("auth.passwordWeak"));
      return;
    }

    // Генерируем уникальный код компании (ровно 8 символов: буквы и цифры)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Получаем настройки пробного плана для вычисления даты окончания
    const freePlanSettings = await plansService.getFreePlanSettings();
    const freePeriodDays = freePlanSettings.freePeriodDays || 60;
    
    // Вычисляем дату окончания пробного периода (из настроек админа)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + freePeriodDays);

    registerCompany({
      name: formData.name,
      code,
      adminEmail: formData.email,
      status: "Пробная", // Первые 2 месяца - пробный период
      plan: "Пробный",
      trialEndDate: trialEndDate.toISOString().split("T")[0],
      employees: 0,
    });
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
              <h1 className="text-3xl font-bold text-foreground mb-2" suppressHydrationWarning>
                {t("auth.register")}
              </h1>
              <p className="text-muted-foreground" suppressHydrationWarning>
                {t("auth.register")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.companyName")}</Label>
              <Input
                id="name"
                placeholder={t("auth.companyName")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="organization"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.adminEmail")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.confirmPassword")}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-1">После регистрации вы получите:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Уникальный код компании для сотрудников</li>
                <li>Доступ к панели управления</li>
                <li>Полный доступ ко всем функциям на период пробного доступа</li>
                <li>После окончания пробного периода - автоматический переход на тарифную систему</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              <span suppressHydrationWarning>
                {isPending ? t("common.loading") : t("auth.register")}
              </span>
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("auth.hasAccount")}</span>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
