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
import { FiLogIn } from "react-icons/fi";
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
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success && result.user) {
      // Используем пользователя из результата логина для определения роли
      if (result.user.role === "admin" || result.user.role === "super_admin") {
        router.replace("/admin");
      } else if (result.user.role === "company") {
        router.replace("/company");
      } else {
        router.replace("/");
      }
      onOpenChange(false);
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
          </form>
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

