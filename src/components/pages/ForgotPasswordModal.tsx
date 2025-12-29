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
import emailjs from '@emailjs/browser';

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Получаем токен от бэкенда
      const response = await authService.forgotPassword({ email });
      
      if (response.resetToken) {
        // 2. Формируем ссылку
        const resetLink = `${window.location.origin}/reset-password?token=${response.resetToken}`;
        
        // 3. Отправляем письмо через EmailJS
        // Проверяем наличие ключей
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          try {
            await emailjs.send(
              serviceId,
              templateId,
              {
                to_email: email,
                reset_link: resetLink,
                // Дополнительные параметры, которые можно использовать в шаблоне EmailJS
                company_name: "FeedbackHub" 
              },
              publicKey
            );
            toast.success(t("auth.resetPasswordSuccess"));
          } catch (emailError) {
            console.error("EmailJS error:", emailError);
            // Если EmailJS не сработал, показываем токен (фоллбэк)
             toast.error(t("auth.resetPasswordEmailError"));
             if (navigator.clipboard) {
                 navigator.clipboard.writeText(resetLink).catch(console.error);
             }
             toast.info(
               <div className="flex flex-col gap-2">
                 <span>{t("auth.resetPasswordLinkCopied")}</span>
                 <span className="text-xs opacity-80 break-all bg-black/10 p-2 rounded select-all">
                   {resetLink}
                 </span>
               </div>,
               { duration: 20000 }
             );
          }
        } else {
           // Если ключи не настроены - показываем токен (для разработки)
           if (navigator.clipboard) {
             navigator.clipboard.writeText(resetLink).catch(console.error);
           }
           toast.success(
             <div className="flex flex-col gap-2">
               <span>{t("auth.resetPasswordSuccess")}</span>
               <span className="text-xs opacity-80 break-all bg-black/10 p-2 rounded select-all">
                 {t("auth.resetPasswordTokenLabel")}: {response.resetToken}
               </span>
               <span className="text-xs italic">{t("auth.resetPasswordTokenCopied")}</span>
             </div>,
             { duration: 20000 }
           );
        }
      } else {
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



