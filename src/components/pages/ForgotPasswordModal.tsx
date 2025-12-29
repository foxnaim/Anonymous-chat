'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiLock } from "react-icons/fi";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordModal = ({ open, onOpenChange }: ForgotPasswordModalProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка валидности email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.forgotPassword({ email });
      setIsLoading(false);
      
      // Если сервер вернул токен (например, при ошибке SMTP), показываем его
      if (response.resetToken) {
        // Копируем токен в буфер обмена для удобства
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(response.resetToken).catch(console.error);
        }

        toast.success(
          <div className="flex flex-col gap-2">
            <span>{t("auth.resetPasswordSuccess")}</span>
            <span className="text-xs opacity-80 break-all bg-black/10 p-2 rounded select-all">
              {t("auth.resetPasswordTokenLabel")}: {response.resetToken}
            </span>
            <span className="text-xs italic">(Токен скопирован)</span>
          </div>,
          { duration: 20000 } // Показываем 20 секунд
        );
      } else {
        // Обычный сценарий успеха
        toast.success(t("auth.resetPasswordSuccess"));
      }
      
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      setIsLoading(false);
      const apiError = error as ApiError;
      toast.error(apiError.message || t("common.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center mb-4">
            <Link href="/" className="mb-4">
              <Image
                src="/feedBack.svg"
                alt="FeedbackHub"
                width={48}
                height={48}
                priority
                className="h-12 w-12"
              />
            </Link>
            <DialogTitle className="text-2xl font-bold" suppressHydrationWarning>
              {t("auth.resetPasswordTitle")}
            </DialogTitle>
            <DialogDescription className="text-center mt-2" suppressHydrationWarning>
              {t("auth.resetPasswordDescription")}
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t("auth.email")}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            <FiLock className="mr-2 h-5 w-5" />
            {isLoading ? t("common.loading") : t("auth.resetPasswordButton")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;



