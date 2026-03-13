'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FiCreditCard, FiLock } from "react-icons/fi";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planPrice: number;
  onPaymentSuccess: () => void;
}

const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return digits.slice(0, 2) + "/" + digits.slice(2);
  }
  return digits;
};

const PaymentModal = ({ open, onOpenChange, planName, planPrice, onPaymentSuccess }: PaymentModalProps) => {
  const { t } = useTranslation();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, "");

    if (digits.length < 16) {
      newErrors.cardNumber = t("payment.invalidCardNumber");
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = t("payment.invalidExpiry");
    } else {
      const [month, year] = expiry.split("/").map(Number);
      if (month < 1 || month > 12) {
        newErrors.expiry = t("payment.invalidExpiry");
      }
      const now = new Date();
      const expiryDate = new Date(2000 + year, month);
      if (expiryDate <= now) {
        newErrors.expiry = t("payment.cardExpired");
      }
    }
    if (cvv.length < 3) {
      newErrors.cvv = t("payment.invalidCvv");
    }
    if (cardHolder.trim().length < 2) {
      newErrors.cardHolder = t("payment.invalidCardHolder");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    // Simulate payment processing
    // In production, integrate with a real payment gateway (Stripe, Kaspi, etc.)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);

    // Reset form
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardHolder("");
    setErrors({});

    onPaymentSuccess();
    onOpenChange(false);
  };

  const handleClose = (value: boolean) => {
    if (!isProcessing) {
      setErrors({});
      onOpenChange(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiCreditCard className="h-5 w-5" />
            {t("payment.title")}
          </DialogTitle>
          <DialogDescription>
            {t("payment.description", { plan: planName, price: planPrice })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("payment.plan")}</span>
            <span className="font-semibold text-foreground">{planName}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">{t("payment.amount")}</span>
            <span className="text-lg font-bold text-primary">{planPrice} ₸</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-number">{t("payment.cardNumber")}</Label>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              autoComplete="cc-number"
              className={errors.cardNumber ? "border-destructive" : ""}
            />
            {errors.cardNumber && (
              <p className="text-xs text-destructive">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">{t("payment.expiry")}</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                autoComplete="cc-exp"
                className={errors.expiry ? "border-destructive" : ""}
              />
              {errors.expiry && (
                <p className="text-xs text-destructive">{errors.expiry}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                placeholder="•••"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                autoComplete="cc-csc"
                className={errors.cvv ? "border-destructive" : ""}
              />
              {errors.cvv && (
                <p className="text-xs text-destructive">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-holder">{t("payment.cardHolder")}</Label>
            <Input
              id="card-holder"
              placeholder={t("payment.cardHolderPlaceholder")}
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              autoComplete="cc-name"
              className={errors.cardHolder ? "border-destructive" : ""}
            />
            {errors.cardHolder && (
              <p className="text-xs text-destructive">{errors.cardHolder}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FiLock className="h-3 w-3" />
            {t("payment.securePayment")}
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? t("payment.processing") : t("payment.pay", { price: planPrice })}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
