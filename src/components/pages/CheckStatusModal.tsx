'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FiSearch, FiClock, FiCheckCircle, FiMessageSquare, FiAlertCircle, FiRefreshCw, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useMessage } from "@/lib/query";

interface CheckStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CheckStatusModal = ({ open, onOpenChange }: CheckStatusModalProps) => {
  const { t } = useTranslation();
  const [messageId, setMessageId] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: message, isLoading, refetch } = useMessage(searchId, {
    enabled: !!searchId,
  });

  // Сбрасываем форму при закрытии модального окна
  useEffect(() => {
    if (!open) {
      setMessageId("");
      setSearchId("");
    }
  }, [open]);

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
    if (!status || typeof status !== 'string') {
      return <FiMessageSquare className="h-5 w-5" />;
    }
    const statusLower = status.toLowerCase();
    const inProgressTranslated = t("checkStatus.inProgress");
    const resolvedTranslated = t("checkStatus.resolved");
    const spamTranslated = t("checkStatus.spam");
    
    if ((inProgressTranslated && statusLower === inProgressTranslated.toLowerCase()) || status === "In Progress" || status === "В работе") {
      return <FiClock className="h-5 w-5" />;
    }
    if ((resolvedTranslated && statusLower === resolvedTranslated.toLowerCase()) || status === "Resolved" || status === "Решено") {
      return <FiCheckCircle className="h-5 w-5" />;
    }
    if ((spamTranslated && statusLower === spamTranslated.toLowerCase()) || status === "Spam" || status === "Спам") {
      return <FiAlertCircle className="h-5 w-5" />;
    }
    return <FiMessageSquare className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') {
      return "bg-muted text-muted-foreground";
    }
    const statusLower = status.toLowerCase();
    const newTranslated = t("checkStatus.new");
    const inProgressTranslated = t("checkStatus.inProgress");
    const resolvedTranslated = t("checkStatus.resolved");
    const spamTranslated = t("checkStatus.spam");
    
    if ((newTranslated && statusLower === newTranslated.toLowerCase()) || status === "New" || status === "Новое") {
        return "bg-accent text-accent-foreground";
    }
    if ((inProgressTranslated && statusLower === inProgressTranslated.toLowerCase()) || status === "In Progress" || status === "В работе") {
        return "bg-secondary text-secondary-foreground";
    }
    if ((resolvedTranslated && statusLower === resolvedTranslated.toLowerCase()) || status === "Resolved" || status === "Решено") {
        return "bg-success text-success-foreground";
    }
    if ((spamTranslated && statusLower === spamTranslated.toLowerCase()) || status === "Spam" || status === "Спам") {
        return "bg-destructive text-destructive-foreground";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("checkStatus.title")}</DialogTitle>
          <DialogDescription>
            {t("checkStatus.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="modal-message-id">{t("checkStatus.messageId")}</Label>
              <div className="flex gap-3">
                <Input
                  id="modal-message-id"
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
            <div className="pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          )}

          {!isLoading && searchId && !message && (
            <div className="pt-6 border-t border-border text-center">
              <p className="text-muted-foreground">{t("checkStatus.notFound")}</p>
            </div>
          )}

          {!isLoading && message && (
            <div className="pt-6 border-t border-border space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <code className="text-lg font-mono font-bold text-primary break-all">
                    {message.id}
                  </code>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-accent border-accent">
                      {getTypeLabel(message.type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {t("checkStatus.sentOn")}{" "}
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleDateString("ru-RU")
                        : t("checkStatus.unknownDate")}
                    </span>
                  </div>
                </div>
                <Badge className={`${getStatusColor(message.status)} flex-shrink-0`}>
                  <span className="mr-2">{getStatusIcon(message.status)}</span>
                  {message.status}
                </Badge>
              </div>

              {message.content && (
                <Card className="bg-muted p-6">
                  <h3 className="font-semibold mb-3">{t("sendMessage.message")}</h3>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {message.content}
                  </p>
                </Card>
              )}

              {message.companyResponse && (
                <Card className="bg-muted p-6">
                  <h3 className="font-semibold mb-3">{t("checkStatus.companyResponse")}</h3>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSearchId("");
                    setMessageId("");
                  }}
                >
                  <FiRefreshCw className="mr-2 h-5 w-5" />
                  {t("checkStatus.checkAnother")}
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  <FiX className="mr-2 h-5 w-5" />
                  {t("common.close")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckStatusModal;

