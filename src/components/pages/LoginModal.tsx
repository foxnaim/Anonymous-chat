'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/redux";
import { FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { toast } from "sonner";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      setIsLoading(false);
      if (result.success && result.user) {
        // Используем пользователя из результата логина для определения роли
        const role = result.user.role?.toLowerCase();
        
        if (role === "admin" || role === "super_admin") {
          router.replace("/admin");
        } else if (role === "company") {
          router.replace("/company");
        } else {
          // Если роль не распознана или это обычный пользователь
          if (role !== "user") {
            toast.error(`Неизвестная роль пользователя: ${result.user.role}`);
          }
          router.replace("/");
        }
        onOpenChange(false);
      }
      // Ошибки уже обрабатываются в authSlice.ts через toast
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
        errorMessage = "Компания заблокирована администратором. Свяжитесь с нами по почте.";
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center mb-4">
              <Link href="/" className="mb-4">
                <Image
                  src="/feedBack.svg"
                  alt="Anonymous Chat"
                  width={48}
                  height={48}
                  priority
                  className="h-12 w-12"
                />
              </Link>
              <DialogTitle className="text-2xl font-bold">FeedbackHub</DialogTitle>
              <DialogDescription className="text-center mt-2">
                {t("auth.login")}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          {!showEmailForm ? (
            <div className="space-y-4">
              <OAuthButtons onEmailClick={() => setShowEmailForm(true)} />
            </div>
          ) : (
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
                <div className="space-y-2">
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
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        setIsForgotPasswordOpen(true);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <FiLogIn className="mr-2 h-5 w-5" />
                {isLoading ? t("common.loading") : t("auth.login")}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-primary hover:underline"
                >
                  {t("auth.backToOAuth") || "Вернуться"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ForgotPasswordModal
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </>
  );
};

export default LoginModal;

