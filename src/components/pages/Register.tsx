'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiHome, FiArrowLeft } from "react-icons/fi";
import { useCreateCompany } from "@/lib/query";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Register = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { mutate: registerCompany, isPending } = useCreateCompany({
    onSuccess: async (company) => {
      // В реальном приложении здесь будет API вызов для создания пользователя
      // Пока сохраняем в localStorage для демо
      const user = {
        id: company.id.toString(),
        email: formData.email,
        role: "company" as const,
        companyId: company.id,
        name: formData.name,
      };
      
      localStorage.setItem("feedbackhub_user", JSON.stringify(user));
      localStorage.setItem(`feedbackhub_password_${formData.email}`, formData.password);

      toast.success(t("auth.registerSuccess"));
      
      // Автоматически входим в систему
      const loginSuccess = await login(formData.email, formData.password);
      
      if (loginSuccess) {
        // Перенаправляем в панель компании
        setTimeout(() => {
          router.replace("/company");
        }, 200);
      } else {
        // Если вход не удался, все равно перенаправляем (пользователь уже сохранен)
        router.replace("/company");
      }
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : t("common.error");
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    // Генерируем уникальный код компании
    const code = `COMP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Вычисляем дату окончания пробного периода (2 месяца от сегодня)
    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + 2);

    registerCompany({
      name: formData.name,
      code,
      adminEmail: formData.email,
      status: "Пробная", // Первые 2 месяца - пробный период
      plan: "Бесплатный",
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
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FiHome className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {mounted ? t("auth.register") : "Регистрация"}
              </h1>
              <p className="text-muted-foreground">
                {mounted ? t("auth.register") : "Регистрация"}
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
                minLength={6}
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
                minLength={6}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-1">После регистрации вы получите:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Уникальный код компании для сотрудников</li>
                <li>Доступ к панели управления</li>
                <li>Полный доступ ко всем функциям на 2 месяца бесплатно</li>
                <li>После окончания пробного периода - автоматический переход на тарифную систему</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (mounted ? t("common.loading") : "Загрузка...") : (mounted ? t("auth.register") : "Регистрация")}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("auth.hasAccount")} </span>
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.login")}
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
