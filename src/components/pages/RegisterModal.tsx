'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCompany } from "@/lib/query";
import { useAuth } from "@/lib/redux";
import { toast } from "sonner";
import { FiKey, FiSettings, FiGift, FiCheck, FiEye, FiEyeOff, FiArrowLeft, FiUserPlus } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterModal = ({ open, onOpenChange }: RegisterModalProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Сбрасываем состояние при закрытии модального окна
  useEffect(() => {
    if (!open) {
      setShowForm(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [open]);

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
          onOpenChange(false);
        }, 200);
      } else {
        // Если вход не удался, все равно перенаправляем (пользователь уже сохранен)
        router.replace("/company");
        onOpenChange(false);
      }
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : t("common.error");
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка валидности email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    // Проверка длины пароля
    if (formData.password.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }

    // Проверка совпадения паролей
    if (formData.password !== formData.confirmPassword) {
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

  // Экран с преимуществами
  if (!showForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg min-h-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col items-center mb-3">
              <DialogTitle className="text-2xl font-bold" suppressHydrationWarning>
                {t("auth.register")}
              </DialogTitle>
              <DialogDescription className="text-center mt-1" suppressHydrationWarning>
                {t("auth.startUsingToday")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground text-center">{t("auth.afterRegistration")}</p>
            
            {/* Все карточки одинакового размера */}
            <div className="grid grid-cols-1 gap-2">
              {/* Карточка с 2 месяцами бесплатно */}
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 border-2 border-primary/30 rounded-lg p-3 h-[90px] flex flex-col justify-center overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FiGift className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm text-foreground">{t("auth.twoMonthsFree")}</p>
                      <Badge className="bg-accent text-accent-foreground border-0 text-xs">{t("auth.trialPeriod")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("auth.fullAccessDescription")}</p>
                  </div>
                </div>
              </div>

              {/* Остальные преимущества - одинакового размера */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors h-[90px]">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FiKey className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-0.5">{t("auth.uniqueCompanyCode")}</p>
                  <p className="text-xs text-muted-foreground">{t("auth.uniqueCompanyCodeDescription")}</p>
                </div>
                <FiCheck className="h-4 w-4 text-primary flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors h-[90px]">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FiSettings className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-0.5">{t("auth.controlPanel")}</p>
                  <p className="text-xs text-muted-foreground">{t("auth.controlPanelDescription")}</p>
                </div>
                <FiCheck className="h-4 w-4 text-primary flex-shrink-0" />
              </div>
            </div>

            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <FiUserPlus className="mr-2 h-5 w-5" />
              {t("auth.register")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Форма регистрации
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg min-h-[600px] max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span className="sr-only">{t("common.back")}</span>
        </button>
        <DialogHeader>
          <div className="flex flex-col items-center mb-4">
            <DialogTitle className="text-2xl font-bold" suppressHydrationWarning>
              {t("auth.register")}
            </DialogTitle>
            <DialogDescription className="text-center mt-2" suppressHydrationWarning>
              {t("auth.fillRegistrationForm")}
            </DialogDescription>
          </div>
        </DialogHeader>

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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isPending} size="lg">
            <FiUserPlus className="mr-2 h-5 w-5" />
            <span suppressHydrationWarning>
              {isPending ? t("common.loading") : t("auth.register")}
            </span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;

