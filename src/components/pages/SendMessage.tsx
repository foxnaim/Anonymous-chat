'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FiArrowLeft, FiSend, FiCopy, FiCheckCircle, FiHome, FiX } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCreateMessage, companyService } from "@/lib/query";
import { MessageType } from "@/types";
import { motion } from "framer-motion";
import { SEO } from "@/lib/seo";

const SendMessage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState<MessageType>("complaint");
  const [message, setMessage] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [messageId, setMessageId] = useState("");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);

  // Получаем код из URL параметров
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCompanyCode(codeFromUrl.toUpperCase());
      setValidatedCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Валидация компании при изменении кода
  const { data: company, isLoading: isValidating } = useQuery({
    queryKey: ["company-by-code", companyCode],
    queryFn: () => companyService.getByCode(companyCode),
    enabled: companyCode.length > 0 && companyCode.length <= 20 && companyCode !== validatedCode,
    retry: false,
  });

  useEffect(() => {
    if (company && companyCode && companyCode === validatedCode) {
      // Код уже подтвержден
      return;
    }
    if (company && companyCode && !validatedCode) {
      if (company.status === t("admin.blocked")) {
        toast.error(t("admin.blockCompany"));
        setCompanyCode("");
        return;
      }
      setValidatedCode(companyCode);
    } else if (!company && companyCode && companyCode.length > 3 && !isValidating) {
      // Код не найден, но только если он достаточно длинный
      setValidatedCode(null);
    }
  }, [company, companyCode, validatedCode, isValidating, t]);

  const { mutate: createMessage, isPending: isSubmitting } = useCreateMessage({
    onSuccess: (newMessage) => {
      setMessageId(newMessage.id);
      setSubmitted(true);
      toast.success(t("sendMessage.success"));
    },
    onError: () => {
      toast.error(t("sendMessage.error"));
    },
  });

  const messageTypes = [
    { value: "complaint", label: t("sendMessage.complaint"), color: "bg-accent/10 text-accent border-accent" },
    { value: "praise", label: t("sendMessage.praise"), color: "bg-secondary/10 text-secondary border-secondary" },
    { value: "suggestion", label: t("sendMessage.suggestion"), color: "bg-primary/10 text-primary border-primary" },
  ];

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase().trim();
    setCompanyCode(upperValue);
    setValidatedCode(null);
  };

  const handleValidateCode = async () => {
    if (!companyCode) {
      toast.error(t("sendMessage.enterCode"));
      return;
    }

    try {
      // Используем сервис для получения компании
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
    } catch (error) {
      toast.error(t("welcome.codeInvalid"));
      setValidatedCode(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedCode || !message || !agreed) {
      toast.error(t("sendMessage.codeRequired"));
      return;
    }

    if (!company) {
      toast.error(t("sendMessage.codeRequired"));
      return;
    }

    createMessage({
      companyCode: validatedCode!,
      type: selectedType,
      content: message,
      status: "Новое",
    });
  };

  const copyMessageId = () => {
    navigator.clipboard.writeText(messageId);
    toast.success(t("sendMessage.idCopied"));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <FiArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <Card className="max-w-2xl w-full p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle className="h-10 w-10 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">{t("sendMessage.messageSent")}</h1>
              <p className="text-muted-foreground">
                {t("sendMessage.saveIdDescription")}
              </p>
            </div>

            <div className="bg-muted p-6 rounded-lg space-y-4">
              <Label className="text-sm font-medium text-muted-foreground">{t("sendMessage.messageId")}</Label>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-2xl font-mono font-bold text-primary bg-background px-4 py-3 rounded-md">
                  {messageId}
                </code>
                <Button size="icon" variant="outline" onClick={copyMessageId}>
                  <FiCopy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("sendMessage.saveIdHint")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" onClick={() => router.push('/check-status')}>
                {t("welcome.checkStatus")}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
                {t("common.back")}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={t("sendMessage.title", { defaultValue: "Отправить анонимное сообщение" })}
        description={t("sendMessage.anonymousMessage", {
          defaultValue: "Отправьте анонимное сообщение в свою компанию. Полная конфиденциальность гарантирована.",
        })}
        keywords="отправить сообщение, анонимное сообщение, обратная связь, жалоба, предложение"
        noindex={false}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <FiArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="max-w-2xl w-full p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">{t("sendMessage.title")}</h1>
              <p className="text-muted-foreground">
                {t("sendMessage.anonymousNote")}
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="company-code" className="text-base font-medium">
                {t("sendMessage.companyCode")}
              </Label>
              <div className="space-y-3">
                <div className="flex gap-3">
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
                    className="text-lg font-mono tracking-wider text-center uppercase"
                    maxLength={20}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    onClick={handleValidateCode}
                    disabled={!companyCode || isValidating}
                    variant={validatedCode ? "outline" : "default"}
                  >
                    {isValidating ? (
                      t("sendMessage.checking")
                    ) : validatedCode ? (
                      <>
                        <FiCheckCircle className="h-4 w-4 mr-2" />
                        {t("sendMessage.confirmed")}
                      </>
                    ) : (
                      t("sendMessage.validateCode")
                    )}
                  </Button>
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
                        <p className="text-sm text-muted-foreground">{t("sendMessage.codeConfirmed")}</p>
                      </div>
                      <Badge variant="outline" className="border-primary text-primary">
                        {company.plan}
                      </Badge>
                    </div>
                  </motion.div>
                )}

                {companyCode && !company && !isValidating && validatedCode === null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive flex items-center gap-2"
                  >
                    <FiX className="h-4 w-4" />
                    {t("sendMessage.companyNotFound")}
                  </motion.div>
                )}

                {!validatedCode && (
                  <p className="text-xs text-muted-foreground">
                    {t("sendMessage.getCodeFromHR")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("sendMessage.messageType")}</Label>
              <div className="flex flex-wrap gap-3">
                {messageTypes.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={selectedType === type.value ? "default" : "outline"}
                    className={selectedType === type.value ? type.color : ""}
                    onClick={() => setSelectedType(type.value as MessageType)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="message">{t("sendMessage.yourMessage")}</Label>
                <span className="text-sm text-muted-foreground">{message.length} / 1000</span>
              </div>
              <Textarea
                id="message"
                placeholder={t("sendMessage.enterMessage")}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                className="min-h-[200px] resize-none text-base"
              />
            </div>

            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-foreground leading-relaxed cursor-pointer"
              >
                {t("sendMessage.termsAgreement")}
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg h-12"
              disabled={!validatedCode || !message || !agreed || isSubmitting}
            >
              <FiSend className="mr-2 h-5 w-5" />
              {isSubmitting ? t("sendMessage.sending") : t("sendMessage.anonymousMessage")}
            </Button>
          </form>
        </Card>
      </main>
      </div>
    </>
  );
};

export default SendMessage;
