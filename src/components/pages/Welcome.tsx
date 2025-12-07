'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiMessageSquare, FiCheckCircle, FiSend, FiLogIn, FiHome, FiX, FiKey, FiHash, FiEye, FiEyeOff, FiSearch, FiUserPlus, FiChevronDown } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/redux";
import { useCompanyByCode, companyService } from "@/lib/query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SEO, WebsiteStructuredData, OrganizationStructuredData } from "@/lib/seo";
import { useDebounce } from "@/hooks/use-debounce";
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

const Welcome = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [companyCode, setCompanyCode] = useState("");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isCheckStatusModalOpen, setIsCheckStatusModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const debouncedCode = useDebounce(companyCode, 500);

  // Передаем код в хук только если он готов (8 символов), иначе пустую строку
  const codeForQuery = debouncedCode.length === 8 ? debouncedCode : "";

  const { data: company, isLoading: isValidating } = useCompanyByCode(codeForQuery, {
    enabled: codeForQuery.length === 8,
    retry: false,
  });

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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-primary">FeedbackHub</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block min-w-[140px]">
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <Button variant="ghost" size="sm" onClick={() => router.push("/company")} className="text-xs sm:text-sm min-w-[140px]">
                  <span className="hidden sm:inline">{t("company.dashboard")}</span>
                  <span className="sm:hidden">{t("company.dashboard")}</span>
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      className="text-xs sm:text-sm px-3 sm:px-4 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
                    >
                      <span className="hidden sm:inline">{t("welcome.business")}</span>
                      <span className="sm:hidden">{t("welcome.business")}</span>
                      <FiChevronDown className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl w-full space-y-4 sm:space-y-6">
          <div className="text-center space-y-2 sm:space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight px-2">
              {t("welcome.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              {t("welcome.subtitle")}
            </p>
          </div>

          {/* Main Content: Form and Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start">
            {/* Company Code Input - Left Side */}
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: validatedCode ? 0 : 120 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="order-2 lg:order-1"
            >
            <Card className="w-full p-4 sm:p-5 md:p-6">
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-foreground">{t("welcome.enterCode")}</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="company-code"
                    placeholder={t("welcome.companyCode")}
                    value={companyCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="text-base sm:text-lg font-mono tracking-wider text-center uppercase"
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
                    className="space-y-4"
                  >
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <FiHome className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{t("welcome.codeValid")}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCompanyCode("");
                            setValidatedCode(null);
                            setPassword("");
                          }}
                        >
                          <FiX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-password" className="text-sm sm:text-base font-medium">
                        {t("welcome.companyPassword")}
                      </Label>
                      <div className="relative">
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
                          className="text-base sm:text-lg pr-10"
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

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  size="lg"
                  className="text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4 h-auto flex-1"
                  onClick={handleSendMessage}
                  disabled={!validatedCode || !password || isVerifyingPassword}
                >
                  <FiSend className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">
                    {isVerifyingPassword ? t("common.loading") : t("welcome.sendMessage")}
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-sm sm:text-base px-4 sm:px-6 py-3 sm:py-4 h-auto"
                  onClick={() => setIsCheckStatusModalOpen(true)}
                >
                  <FiCheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">{t("welcome.checkStatus")}</span>
                </Button>
              </div>
            </div>
          </Card>
            </motion.div>

            {/* Three-Step Guide Section - Right Side */}
            <div className="w-full p-3 sm:p-4 md:p-5 order-1 lg:order-2 lg:sticky lg:top-8 flex flex-col h-full">
              <div className="space-y-3 flex-1">
                <div className="text-center lg:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                    {t("welcome.howItWorks")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("welcome.howItWorksDescription")}
                  </p>
                </div>
                
                <div className="space-y-3 lg:space-y-4">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-4 group"
                    >
                      {/* Icon Circle */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                          <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" style={{ color: 'hsl(var(--primary-foreground))' }} />
                        </div>
                        {/* Number Badge */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-md" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                          <span className="text-xs sm:text-sm font-bold text-primary-foreground" style={{ color: 'hsl(var(--primary-foreground))' }}>{step.number}</span>
                        </div>
                      </div>
                      {/* Text */}
                      <div className="flex-1 pt-1">
                        <p className="text-sm sm:text-base font-semibold text-foreground leading-tight">
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
      <footer className="border-t border-border bg-card shrink-0">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <p className="text-xs text-muted-foreground text-center">
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
