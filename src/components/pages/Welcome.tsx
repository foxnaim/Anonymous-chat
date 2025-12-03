'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiMessageSquare, FiCheckCircle, FiSend, FiLogIn, FiHome, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/redux";
import { useCompanyByCode, companyService } from "@/lib/query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SEO, WebsiteStructuredData, OrganizationStructuredData } from "@/lib/seo";

const Welcome = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [companyCode, setCompanyCode] = useState("");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);

  const { data: company, isLoading: isValidating } = useCompanyByCode(companyCode, {
    enabled: companyCode.length > 0 && companyCode.length <= 20,
    retry: false,
  });

  const handleCodeChange = (value: string) => {
    setCompanyCode(value.toUpperCase().trim());
    setValidatedCode(null);
  };

  const handleValidateCode = async () => {
    if (!companyCode) {
      toast.error(t("welcome.enterCode"));
      return;
    }

    const foundCompany = await companyService.getByCode(companyCode);
    if (!foundCompany) {
      toast.error(t("welcome.codeInvalid"));
      setValidatedCode(null);
      return;
    }

    if (foundCompany.status === t("admin.blocked")) {
      toast.error(t("admin.blockCompany"));
      setValidatedCode(null);
      return;
    }

    setValidatedCode(companyCode);
    toast.success(`${t("welcome.codeValid")}: ${foundCompany.name}`);
  };

  const handleSendMessage = () => {
    if (!validatedCode) {
      toast.error(t("sendMessage.codeRequired"));
      return;
    }
    router.push(`/send-message?code=${validatedCode}`);
  };

  const steps = [
    { number: "1", title: t("welcome.enterCode"), icon: FiMessageSquare },
    { number: "2", title: t("sendMessage.enterMessage"), icon: FiSend },
    { number: "3", title: t("checkStatus.messageId"), icon: FiCheckCircle },
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-primary">FeedbackHub</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block w-48">
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <Button variant="ghost" size="sm" onClick={() => router.push("/company")} className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">{t("company.dashboard")}</span>
                  <span className="sm:hidden">{t("company.dashboard")}</span>
                </Button>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="ghost" size="sm" onClick={() => router.push("/register")} className="text-xs sm:text-sm px-2 sm:px-3">
                    <span className="hidden sm:inline">{t("welcome.register")}</span>
                    <span className="sm:hidden">{t("welcome.register")}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="text-xs sm:text-sm px-2 sm:px-3">
                    <FiLogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("welcome.login")}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl w-full text-center space-y-8 sm:space-y-12">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight px-2">
              {t("welcome.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              {t("welcome.subtitle")}
            </p>
          </div>

          {/* Company Code Input */}
          <Card className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{t("welcome.enterCode")}</h2>
                <p className="text-muted-foreground">
                  {t("welcome.companyCode")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-code" className="text-sm sm:text-base font-medium">
                    {t("welcome.companyCode")}
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Input
                      id="company-code"
                      placeholder={t("welcome.companyCodePlaceholder")}
                      value={companyCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && companyCode) {
                          handleValidateCode();
                        }
                      }}
                      className="text-base sm:text-lg font-mono tracking-wider text-center uppercase"
                      maxLength={20}
                      autoComplete="off"
                    />
                    <Button
                      onClick={handleValidateCode}
                      disabled={!companyCode || isValidating}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {isValidating ? (
                        t("common.loading")
                      ) : validatedCode ? (
                        <FiCheckCircle className="h-5 w-5" />
                      ) : (
                        t("welcome.validateCode")
                      )}
                    </Button>
                  </div>
                </div>

                {company && validatedCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/10 border border-primary/20 rounded-lg p-4"
                  >
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
                        }}
                      >
                        <FiX className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {companyCode && !company && !isValidating && validatedCode === null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {t("welcome.codeInvalid")}
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto flex-1"
                  onClick={handleSendMessage}
                  disabled={!validatedCode}
                >
                  <FiSend className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">{t("welcome.sendMessage")}</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                  onClick={() => router.push("/check-status")}
                >
                  <FiCheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">{t("welcome.checkStatus")}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Steps */}
          <Card className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 mt-8 sm:mt-12 md:mt-16">
            <h3 className="text-base sm:text-lg font-semibold mb-6 sm:mb-8 text-foreground">{t("welcome.title")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base sm:text-lg">
                    {step.number}
                  </div>
                  <step.icon className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                  <p className="text-xs sm:text-sm font-medium text-foreground">{step.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 FeedbackHub. {t("welcome.anonymityGuaranteed")}
          </p>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Welcome;
