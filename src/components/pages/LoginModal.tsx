'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/redux";
import { FiLogIn } from "react-icons/fi";
import { toast } from "sonner";
import ForgotPasswordModal from "./ForgotPasswordModal";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      // Небольшая задержка для обновления состояния пользователя
      setTimeout(() => {
        // Получаем пользователя из localStorage для определения роли
        const savedUser = localStorage.getItem("feedbackhub_user");
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            if (userData.role === "admin") {
              router.replace("/admin");
            } else if (userData.role === "company") {
              router.replace("/company");
            } else {
              router.replace("/");
            }
          } catch {
            router.replace("/");
          }
        } else {
          router.replace("/");
        }
        onOpenChange(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FiLogIn className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">FeedbackHub</DialogTitle>
            <DialogDescription className="text-center mt-2">
              {t("auth.login")}
            </DialogDescription>
          </div>
        </DialogHeader>
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
              <Input
                id="password"
                type="password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("common.loading") : t("auth.login")}
          </Button>
        </form>
      </DialogContent>
      <ForgotPasswordModal
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </Dialog>
  );
};

export default LoginModal;

