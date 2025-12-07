'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiLock } from "react-icons/fi";
import { toast } from "sonner";

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
    
    // Имитация отправки запроса на восстановление пароля
    // В реальном приложении здесь будет API вызов
    setTimeout(() => {
      setIsLoading(false);
      toast.success(t("auth.resetPasswordSuccess"));
      setEmail("");
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FiLock className="h-8 w-8 text-primary" />
            </div>
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
            {isLoading ? t("common.loading") : t("auth.resetPasswordButton")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;



