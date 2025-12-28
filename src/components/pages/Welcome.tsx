'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiMessageSquare, FiCheckCircle, FiSend, FiLogIn, FiHome, FiX, FiKey, FiHash, FiEye, FiEyeOff, FiSearch, FiUserPlus, FiChevronDown, FiLayout } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/redux";
import { useCompanyByCode, companyService } from "@/lib/query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SEO, WebsiteStructuredData, OrganizationStructuredData } from "@/lib/seo";
import { useDebounce } from "@/hooks/use-debounce";
import { getToken } from "@/lib/utils/cookies";
import SendMessageModal from "./SendMessageModal";
import CheckStatusModal from "./CheckStatusModal";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Company } from "@/types";

export interface WelcomeProps {
  initialCompanyCode?: string;
  initialCompany?: Company | null;
}

function Welcome({ initialCompanyCode, initialCompany }: WelcomeProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [companyCode, setCompanyCode] = useState("");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isCheckStatusModalOpen, setIsCheckStatusModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [codeFromUrlLoaded, setCodeFromUrlLoaded] = useState(false);

  // Инициализируем код компании из props или URL
  useEffect(() => {
    if (!codeFromUrlLoaded) {
      // Приоритет: initialCompanyCode из props, затем из URL
      const codeToUse = initialCompanyCode || searchParams.get("code");
      if (codeToUse && codeToUse.length === 8) {
        const normalizedCode = codeToUse.toUpperCase().trim();
        setCompanyCode(normalizedCode);
        setCodeFromUrlLoaded(true);
      }
    }
  }, [searchParams, codeFromUrlLoaded, initialCompanyCode]);

  const debouncedCode = useDebounce(companyCode, 500);

  // Передаем код в хук только если он готов (8 символов), иначе пустую строку
  const codeForQuery = debouncedCode.length === 8 ? debouncedCode : "";

  const { data: companyFromQuery, isLoading: isValidating } = useCompanyByCode(codeForQuery, {
    enabled: codeForQuery.length === 8 && !initialCompany, // Не запрашиваем, если уже есть initialCompany
    retry: false,
  });

  // Используем initialCompany если он предоставлен и код совпадает, иначе используем данные из запроса
  const company = initialCompany && initialCompanyCode && debouncedCode === initialCompanyCode.toUpperCase() 
    ? initialCompany 
    : companyFromQuery;

  // Автоматическая проверка кода только после ввода 8 символов
  useEffect(() => {
    // Сбрасываем валидацию, если код не равен 8 символам
    if (debouncedCode.length !== 8) {
      setValidatedCode(null);
      return;
    }

    // Проверяем только когда код равен 8 символам
    if (debouncedCode.length === 8 && company) {
      if (company.status === t("admin.blocked")) {
        toast.error(t("admin.blockCompany"));
        setValidatedCode(null);
        return;
      }
      setValidatedCode(debouncedCode);
    } else if (debouncedCode.length === 8 && !isValidating && !company) {
      setValidatedCode(null);
    }
  }, [company, debouncedCode, isValidating, t]);

  const handleCodeChange = (value: string) => {
    setCompanyCode(value.toUpperCase().trim());
    setValidatedCode(null);
    setPassword("");
  };

  const handleSendMessage = async () => {
    if (!validatedCode) {
      toast.error(t("welcome.enterCode"));
      return;
    }

    if (validatedCode.length !== 8) {
      toast.error(t("welcome.codeLengthError"));
      return;
    }

    if (!password) {
      toast.error(t("welcome.passwordRequired"));
      return;
    }

    if (password.length !== 10) {
      toast.error(t("welcome.passwordLengthError"));
      return;
    }

    setIsVerifyingPassword(true);
    try {
      const isValid = await companyService.verifyPassword(validatedCode, password);
      if (!isValid) {
        toast.error(t("welcome.passwordInvalid"));
        setIsVerifyingPassword(false);
        return;
      }
      // Открываем модальное окно вместо редиректа
      setIsSendMessageModalOpen(true);
      setIsVerifyingPassword(false);
    } catch (error) {
      toast.error(t("welcome.passwordError"));
      setIsVerifyingPassword(false);
    }
  };

  const steps = [
    { number: "1", title: t("sendMessage.step1Title"), icon: FiKey },
    { number: "2", title: t("sendMessage.step2Title"), icon: FiMessageSquare },
    { number: "3", title: t("sendMessage.step3Title"), icon: FiHash },
    { number: "4", title: t("sendMessage.step4Title"), icon: FiSearch },
  ];

  return (
    <>
      <SEO
        title={t("welcome.title", { defaultValue: "Отправьте анонимный отзыв в свою компанию" })}
        description={t("welcome.subtitle", {
          defaultValue: "Делитесь честными мыслями, жалобами, похвалами или предложениями без раскрытия личности. Ваш голос важен, и мы сохраняем полную конфиденциальность.",
        })}
        keywords="анонимные отзывы, обратная связь, HR, жалобы, предложения, анонимность, конфиденциальность"
      />
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Image
                src="/feedBack.svg"
                alt="Anonymous Chat"
                width={32}
                height={32}
                priority
                className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
              />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="hidden sm:block min-w-[120px] sm:min-w-[140px]">
                <LanguageSwitcher />
              </div>
              {(() => {
                // Проверяем токен напрямую, чтобы сразу скрыть кнопку при его отсутствии
                const token = getToken();
                const hasValidAuth = token && isAuthenticated && user;
                
                if (hasValidAuth) {
                  return (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (user!.role === "admin" || user!.role === "super_admin") {
                          router.push("/admin");
                        } else if (user!.role === "company") {
                          router.push("/company");
                        }
                      }} 
                      className="text-[10px] sm:text-xs md:text-sm min-w-[100px] sm:min-w-[120px] md:min-w-[140px] px-2 sm:px-3"
                    >
                      <FiLayout className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="truncate">{t("common.controlPanel")}</span>
                    </Button>
                  );
                }
                
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px] sm:min-w-[120px] md:min-w-[140px]"
                      >
                        <span className="truncate">{t("welcome.business")}</span>
                        <FiChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setIsLoginModalOpen(true)}>
                        <FiLogIn className="mr-2 h-4 w-4" />
                        <span>{t("welcome.login")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsRegisterModalOpen(true)}>
                        <FiUserPlus className="mr-2 h-4 w-4" />
                        <span>{t("welcome.register")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="max-w-7xl w-full space-y-2 sm:space-y-4 md:space-y-6 min-w-0">
          <div className="text-center space-y-1 sm:space-y-2 md:space-y-3 min-w-0 px-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight break-words">
              {t("welcome.title")}
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto break-words px-1">
              {t("welcome.subtitle")}
            </p>
          </div>

          {/* Main Content: Form and Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 sm:gap-4 md:gap-6 lg:gap-8 items-start min-w-0">
            {/* Company Code Input - Left Side - Form should be first on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="order-1 min-w-0 relative z-10"
            >
            <Card className="w-full p-3 sm:p-4 md:p-5 lg:p-6 min-w-0 overflow-hidden">
            <div className="space-y-2.5 sm:space-y-3 md:space-y-4 min-w-0">
              <div className="text-center space-y-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">{t("welcome.enterCode")}</h2>
              </div>

              <div className="space-y-2.5 sm:space-y-3 md:space-y-4 min-w-0">
                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                  <Input
                    id="company-code"
                    placeholder={t("welcome.companyCode")}
                    value={companyCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="text-xs sm:text-sm md:text-base font-mono tracking-wider text-center uppercase h-9 sm:h-10 md:h-11 lg:h-12 w-full max-w-full"
                    maxLength={8}
                    autoComplete="off"
                  />
                  {isValidating && (
                    <p className="text-sm text-muted-foreground text-center">{t("common.loading")}</p>
                  )}
                  {!isValidating && companyCode.length > 0 && companyCode.length < 8 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground text-center mt-1"
                    >
                      {t("welcome.codeLengthHint")}
                    </motion.p>
                  )}
                </div>

                {company && validatedCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 sm:space-y-4 min-w-0"
                  >
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-3 md:p-4 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FiHome className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-xs sm:text-sm md:text-base truncate">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{t("welcome.codeValid")}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                          onClick={() => {
                            setCompanyCode("");
                            setValidatedCode(null);
                            setPassword("");
                          }}
                        >
                          <FiX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label htmlFor="company-password" className="text-xs sm:text-sm md:text-base font-medium">
                        {t("welcome.companyPassword")}
                      </Label>
                      <div className="relative min-w-0">
                        <Input
                          id="company-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("welcome.companyPasswordPlaceholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && password && validatedCode) {
                              handleSendMessage();
                            }
                          }}
                          className="text-xs sm:text-sm md:text-base pr-9 sm:pr-10 h-9 sm:h-10 md:h-11 lg:h-12 w-full max-w-full"
                          maxLength={10}
                          autoComplete="off"
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
                      {password.length > 0 && password.length !== 10 && (
                        <p className="text-xs text-muted-foreground">
                          {t("welcome.passwordLengthHint")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {companyCode && !company && !isValidating && debouncedCode.length === 8 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {t("welcome.codeInvalid")}
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 min-w-0">
                <Button
                  size="lg"
                  className="text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 h-auto flex-1 min-h-[40px] sm:min-h-[44px] md:min-h-[48px] min-w-0"
                  onClick={handleSendMessage}
                  disabled={!validatedCode || !password || isVerifyingPassword}
                >
                  <FiSend className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base truncate min-w-0">
                    {isVerifyingPassword ? t("common.loading") : t("welcome.sendMessage")}
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 h-auto min-h-[40px] sm:min-h-[44px] md:min-h-[48px] flex-shrink-0 whitespace-nowrap"
                  onClick={() => setIsCheckStatusModalOpen(true)}
                >
                  <FiCheckCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base">{t("welcome.checkStatus")}</span>
                </Button>
              </div>
            </div>
          </Card>
            </motion.div>

            {/* How It Works Section - Below form on mobile, right side on desktop */}
            <div className="w-full p-3 sm:p-4 md:p-5 lg:p-5 order-2 lg:sticky lg:top-8 flex flex-col min-w-0 overflow-hidden mt-2 sm:mt-0 relative z-0">
              <div className="space-y-3 sm:space-y-3.5 md:space-y-4 flex-1 min-w-0">
                <div className="text-center lg:text-left min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-foreground mb-1 sm:mb-1.5 break-words">
                    {t("welcome.howItWorks")}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-sm text-muted-foreground break-words mb-3 sm:mb-3.5">
                    {t("welcome.howItWorksDescription")}
                  </p>
                </div>
                
                <div className="space-y-3 sm:space-y-3.5 md:space-y-4 lg:space-y-4 min-w-0">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-3 sm:gap-3.5 md:gap-4 lg:gap-4 group min-w-0"
                    >
                      {/* Icon Circle */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                          <step.icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary-foreground" style={{ color: 'hsl(var(--primary-foreground))' }} />
                        </div>
                        {/* Number Badge */}
                        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-md" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                          <span className="text-[10px] sm:text-xs md:text-xs lg:text-sm font-bold text-primary-foreground" style={{ color: 'hsl(var(--primary-foreground))' }}>{step.number}</span>
                        </div>
                      </div>
                      {/* Text */}
                      <div className="flex-1 pt-1 sm:pt-1 min-w-0">
                        <p className="text-sm sm:text-sm md:text-base lg:text-base font-semibold text-foreground leading-tight break-words">
                          {step.title}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card shrink-0 overflow-x-hidden">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 max-w-full">
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center break-words">
            © 2025 FeedbackHub. {t("welcome.anonymityGuaranteed")}
          </p>
        </div>
      </footer>
      </div>

      {/* Модальное окно отправки сообщения */}
      <SendMessageModal
        open={isSendMessageModalOpen}
        onOpenChange={setIsSendMessageModalOpen}
        companyCode={validatedCode || ""}
        companyName={company?.name || ""}
        companyPlan={company?.plan}
        onSuccess={() => {
          // После успешной отправки можно сбросить форму
          setCompanyCode("");
          setValidatedCode(null);
          setPassword("");
        }}
      />

      {/* Модальное окно проверки статуса */}
      <CheckStatusModal
        open={isCheckStatusModalOpen}
        onOpenChange={setIsCheckStatusModalOpen}
      />

      {/* Модальное окно входа */}
      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
      />

      {/* Модальное окно регистрации */}
      <RegisterModal
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
      />
    </>
  );
};

export default Welcome;
