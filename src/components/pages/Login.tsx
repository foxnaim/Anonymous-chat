'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/redux";
import { FiLogIn, FiArrowLeft } from "react-icons/fi";
import { motion } from "framer-motion";
const Login = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      // Небольшая задержка для обновления состояния пользователя
      setTimeout(() => {
        const from = searchParams?.get('from');
        if (from) {
          router.replace(from as any);
        } else {
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
        }
      }, 200);
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
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FiLogIn className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">FeedbackHub</h1>
              <p className="text-muted-foreground">{t("auth.login")}</p>
            </div>
          </div>
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
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-1">Демо доступ:</p>
              <p>Email: admin@acme.com (компания)</p>
              <p>Email: admin@feedbackhub.com (админ)</p>
              <p>Пароль: password</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.login")}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t("auth.noAccount")}</span>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
export default Login;
