'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FiSend, FiCopy, FiCheckCircle, FiHome, FiSearch, FiClock, FiShield, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useCreateMessage } from "@/lib/query";
import { MessageType } from "@/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyCode: string;
  companyName: string;
  companyPlan?: string;
  onSuccess?: () => void;
}

const SendMessageModal = ({ 
  open, 
  onOpenChange, 
  companyCode,
  companyName,
  companyPlan,
  onSuccess 
}: SendMessageModalProps) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<MessageType>("complaint");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [messageId, setMessageId] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  // Сбрасываем форму при закрытии модального окна
  useEffect(() => {
    if (!open) {
      setMessage("");
      setAgreed(false);
      setSubmitted(false);
      setMessageId("");
      setIsSubmittingLocal(false);
    }
  }, [open]);

  const { mutate: createMessage, isPending: isSubmitting } = useCreateMessage({
    onSuccess: (newMessage) => {
      setMessageId(newMessage.id);
      setSubmitted(true);
      setIsSubmittingLocal(false);
      toast.success(t("sendMessage.success"));
    },
    onError: (error: any) => {
      setIsSubmittingLocal(false);
      // Обработка различных типов ошибок
      let errorMessage = t("sendMessage.error");
      
      if (error?.message && typeof error.message === 'string') {
        const message = error.message.toLowerCase();
        if (message.includes("not found") || message.includes("company")) {
          errorMessage = t("sendMessage.companyNotFound") || "Компания не найдена";
        } else if (message.includes("limit") || message.includes("exceeded")) {
          errorMessage = t("sendMessage.messageLimitExceeded");
        } else if (message.includes("required")) {
          errorMessage = t("sendMessage.fillRequiredFields");
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    },
  });

  const messageTypes = [
    { value: "complaint", label: t("sendMessage.complaint"), color: "bg-accent/10 text-accent border-accent" },
    { value: "praise", label: t("sendMessage.praise"), color: "bg-secondary/10 text-secondary border-secondary" },
    { value: "suggestion", label: t("sendMessage.suggestion"), color: "bg-primary/10 text-primary border-primary" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Защита от повторной отправки
    if (isSubmittingLocal || isSubmitting) {
      return;
    }
    
    // Валидация
    if (!companyCode || companyCode.length !== 8) {
      toast.error(t("welcome.codeLengthError") || "Код компании должен содержать 8 символов");
      return;
    }
    
    if (!message || message.trim().length === 0) {
      toast.error(t("sendMessage.codeRequired") || "Заполните сообщение");
      return;
    }
    
    if (!agreed) {
      toast.error(t("sendMessage.codeRequired") || "Подтвердите условия");
      return;
    }

    // Блокируем повторные нажатия
    setIsSubmittingLocal(true);

    // Отправляем сообщение
    createMessage({
      companyCode: companyCode.toUpperCase(),
      type: selectedType,
      content: message.trim(),
      status: "Новое",
    });
  };

  const copyMessageId = () => {
    navigator.clipboard.writeText(messageId);
    toast.success(t("sendMessage.idCopied"));
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onSuccess && submitted) {
      onSuccess();
    }
    // Reset state when closing after submission to prevent issues with browser back button
    if (submitted) {
      setTimeout(() => {
        setSubmitted(false);
        setMessageId("");
      }, 100);
    }
  };

  // Экран успешной отправки
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] min-h-[500px] sm:min-h-[600px] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">{t("sendMessage.messageSent")}</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            {t("sendMessage.saveIdDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col min-h-[400px] sm:min-h-[500px]">
          <div className="space-y-4 sm:space-y-6 flex-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>

            <div className="bg-muted p-4 sm:p-6 rounded-lg space-y-3 sm:space-y-4">
              <Label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("sendMessage.messageId")}</Label>
              <div className="flex items-center gap-2 sm:gap-3">
                <code className="flex-1 text-base sm:text-lg md:text-xl font-mono font-bold text-primary bg-background px-3 sm:px-4 py-2 sm:py-3 rounded-md break-all">
                  {messageId}
                </code>
                <Button size="icon" variant="outline" onClick={copyMessageId} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                  <FiCopy className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("sendMessage.saveIdHint")}
              </p>
            </div>

            {/* Информационный блок о том, что делать с ID */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <FiShield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{t("sendMessage.whatToDoWithId")}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-foreground mb-1">{t("sendMessage.checkStatus")}</p>
                    <p className="text-xs text-muted-foreground">{t("sendMessage.checkStatusDescription")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FiClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-foreground mb-1">{t("sendMessage.trackResponse")}</p>
                    <p className="text-xs text-muted-foreground">{t("sendMessage.trackResponseDescription")}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <FiShield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {t("sendMessage.idSecurityNote")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-auto">
            <Button className="flex-1 text-sm sm:text-base h-10 sm:h-12" onClick={handleClose}>
              <FiX className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t("common.close")}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] min-h-[500px] sm:min-h-[600px] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t("sendMessage.title")}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t("sendMessage.anonymousNote")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Информация о компании */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FiHome className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm sm:text-base truncate">{companyName}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("sendMessage.codeConfirmed")}</p>
              </div>
              {companyPlan && (
                <Badge variant="outline" className="border-primary text-primary text-xs sm:text-sm flex-shrink-0">
                  {companyPlan}
                </Badge>
              )}
            </div>
          </motion.div>

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm sm:text-base">{t("sendMessage.messageType")}</Label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {messageTypes.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={selectedType === type.value ? "default" : "outline"}
                  className={cn(
                    selectedType === type.value ? type.color : "",
                    "text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 h-auto"
                  )}
                  onClick={() => setSelectedType(type.value as MessageType)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="modal-message" className="text-sm sm:text-base">{t("sendMessage.yourMessage")}</Label>
              <span className="text-xs sm:text-sm text-muted-foreground">{message.length} / 1000</span>
            </div>
            <Textarea
              id="modal-message"
              placeholder={t("sendMessage.enterMessage")}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              className="min-h-[120px] sm:min-h-[150px] resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-muted rounded-lg">
            <Checkbox
              id="modal-terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-0.5 sm:mt-1"
            />
            <label
              htmlFor="modal-terms"
              className="text-xs sm:text-sm text-foreground leading-relaxed cursor-pointer flex-1"
            >
              {t("sendMessage.termsAgreement")}
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-sm sm:text-base md:text-lg"
              onClick={() => onOpenChange(false)}
            >
              <FiX className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-sm sm:text-base md:text-lg"
              disabled={!message || !agreed || isSubmitting || isSubmittingLocal}
            >
              <FiSend className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {(isSubmitting || isSubmittingLocal) ? t("sendMessage.sending") : t("sendMessage.anonymousMessage")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageModal;

