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
import { FiSend, FiCopy, FiCheckCircle, FiHome } from "react-icons/fi";
import { toast } from "sonner";
import { useCreateMessage } from "@/lib/query";
import { MessageType } from "@/types";
import { motion } from "framer-motion";

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

  // Сбрасываем форму при закрытии модального окна
  useEffect(() => {
    if (!open) {
      setMessage("");
      setAgreed(false);
      setSubmitted(false);
      setMessageId("");
    }
  }, [open]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !agreed) {
      toast.error(t("sendMessage.codeRequired"));
      return;
    }

    createMessage({
      companyCode: companyCode,
      type: selectedType,
      content: message,
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
  };

  // Экран успешной отправки
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-center">{t("sendMessage.messageSent")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("sendMessage.saveIdDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <FiCheckCircle className="h-10 w-10 text-primary" />
            </div>

            <div className="bg-muted p-6 rounded-lg space-y-4">
              <Label className="text-sm font-medium text-muted-foreground">{t("sendMessage.messageId")}</Label>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-xl font-mono font-bold text-primary bg-background px-4 py-3 rounded-md break-all">
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
              <Button className="flex-1" onClick={handleClose}>
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("sendMessage.title")}</DialogTitle>
          <DialogDescription>
            {t("sendMessage.anonymousNote")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Информация о компании */}
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
                <p className="font-semibold text-foreground">{companyName}</p>
                <p className="text-sm text-muted-foreground">{t("sendMessage.codeConfirmed")}</p>
              </div>
              {companyPlan && (
                <Badge variant="outline" className="border-primary text-primary">
                  {companyPlan}
                </Badge>
              )}
            </div>
          </motion.div>

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
              <Label htmlFor="modal-message">{t("sendMessage.yourMessage")}</Label>
              <span className="text-sm text-muted-foreground">{message.length} / 1000</span>
            </div>
            <Textarea
              id="modal-message"
              placeholder={t("sendMessage.enterMessage")}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              className="min-h-[150px] resize-none text-base"
            />
          </div>

          <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
            <Checkbox
              id="modal-terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label
              htmlFor="modal-terms"
              className="text-sm text-foreground leading-relaxed cursor-pointer"
            >
              {t("sendMessage.termsAgreement")}
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 text-lg h-12"
              disabled={!message || !agreed || isSubmitting}
            >
              <FiSend className="mr-2 h-5 w-5" />
              {isSubmitting ? t("sendMessage.sending") : t("sendMessage.anonymousMessage")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageModal;

