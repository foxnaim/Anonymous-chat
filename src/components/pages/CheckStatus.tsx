'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FiArrowLeft, FiSearch, FiClock, FiCheckCircle, FiMessageSquare, FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMessage } from "@/lib/query";
import { SEO } from "@/lib/seo";

const CheckStatus = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [messageId, setMessageId] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: message, isLoading, refetch } = useMessage(searchId, {
    enabled: !!searchId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageId) {
      toast.error(t("checkStatus.enterId"));
      return;
    }
    setSearchId(messageId);
    refetch();
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === t("checkStatus.inProgress").toLowerCase() || status === "In Progress" || status === "В работе") {
      return <FiClock className="h-5 w-5" />;
    }
    if (statusLower === t("checkStatus.resolved").toLowerCase() || status === "Resolved" || status === "Решено") {
      return <FiCheckCircle className="h-5 w-5" />;
    }
    if (statusLower === t("checkStatus.spam").toLowerCase() || status === "Spam" || status === "Спам") {
      return <FiAlertCircle className="h-5 w-5" />;
    }
    return <FiMessageSquare className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === t("checkStatus.new").toLowerCase() || status === "New" || status === "Новое") {
        return "bg-accent text-accent-foreground"; /* #F64C72 */
    }
    if (statusLower === t("checkStatus.inProgress").toLowerCase() || status === "In Progress" || status === "В работе") {
        return "bg-secondary text-secondary-foreground"; /* #553D67 */
    }
    if (statusLower === t("checkStatus.resolved").toLowerCase() || status === "Resolved" || status === "Решено") {
        return "bg-success text-success-foreground"; /* Green */
    }
    if (statusLower === t("checkStatus.spam").toLowerCase() || status === "Spam" || status === "Спам") {
        return "bg-destructive text-destructive-foreground"; /* Red for spam */
    }
    return "bg-muted text-muted-foreground";
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "complaint":
        return t("sendMessage.complaint");
      case "praise":
        return t("sendMessage.praise");
      case "suggestion":
        return t("sendMessage.suggestion");
      default:
        return type;
    }
  };

  return (
    <>
      <SEO
        title={t("checkStatus.title", { defaultValue: "Проверить статус сообщения" })}
        description={t("checkStatus.description", {
          defaultValue: "Введите ID вашего сообщения, чтобы отследить статус отзыва.",
        })}
        keywords="проверить статус, отследить сообщение, статус отзыва, ID сообщения"
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

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-foreground">{t("checkStatus.title")}</h1>
            <p className="text-lg text-muted-foreground">
              {t("checkStatus.description")}
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="message-id">{t("checkStatus.messageId")}</Label>
                <div className="flex gap-3">
                  <Input
                    id="message-id"
                    placeholder={t("checkStatus.messageIdPlaceholder")}
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    className="text-lg font-mono"
                    autoComplete="off"
                  />
                  <Button type="submit" size="lg">
                    <FiSearch className="h-5 w-5 mr-2" />
                    {t("checkStatus.search")}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("checkStatus.enterIdDescription")}
                </p>
              </div>
            </form>

            {isLoading && searchId && (
              <div className="mt-8 pt-8 border-t border-border text-center">
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            )}

            {!isLoading && searchId && !message && (
              <div className="mt-8 pt-8 border-t border-border text-center">
                <p className="text-muted-foreground">{t("checkStatus.notFound")}</p>
              </div>
            )}

            {!isLoading && message && (
              <div className="mt-8 pt-8 border-t border-border space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <code className="text-lg font-mono font-bold text-primary">
                      {message.id}
                    </code>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-accent border-accent">
                        {getTypeLabel(message.type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {t("checkStatus.sentOn")} {new Date(message.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(message.status)}>
                    <span className="mr-2">{getStatusIcon(message.status)}</span>
                    {message.status}
                  </Badge>
                </div>

                {message.companyResponse && (
                  <Card className="bg-muted p-6">
                    <h3 className="font-semibold mb-3">{t("checkStatus.companyResponse")}</h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {message.companyResponse}
                    </p>
                    {message.lastUpdate && (
                      <p className="text-xs text-muted-foreground mt-4">
                        {t("checkStatus.lastUpdate")} {new Date(message.lastUpdate).toLocaleDateString("ru-RU")}
                      </p>
                    )}
                  </Card>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/send-message')}>
                    {t("checkStatus.sendAnother")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSearchId("");
                      setMessageId("");
                    }}
                  >
                    {t("checkStatus.checkAnother")}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
      </div>
    </>
  );
};

export default CheckStatus;
